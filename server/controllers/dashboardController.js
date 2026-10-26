const User = require('../models/User');
const Request = require('../models/Request');
const Sample = require('../models/Sample');
const QCRecord = require('../models/QCRecord');
const SequencingRun = require('../models/SequencingRun');
const AnalysisResult = require('../models/AnalysisResult');
const Report = require('../models/Report');

// @desc Get role-scoped dashboard metrics, charts, and queues
// @route GET /api/v1/dashboard/summary
// @access Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'admin') {
      // 1. Total users
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      // 2. Requests by status
      const requestStatusAgg = await Request.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const requestsByStatus = {};
      ['submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'completed'].forEach(
        (st) => {
          requestsByStatus[st] = 0;
        }
      );
      requestStatusAgg.forEach((item) => {
        if (item._id) requestsByStatus[item._id] = item.count;
      });

      // 3. Samples by stage
      const sampleStageAgg = await Sample.aggregate([
        { $group: { _id: '$currentStage', count: { $sum: 1 } } },
      ]);
      const samplesByStage = {};
      ['registered', 'qc', 'sequencing', 'analysis', 'report_ready', 'delivered'].forEach(
        (st) => {
          samplesByStage[st] = 0;
        }
      );
      sampleStageAgg.forEach((item) => {
        if (item._id) samplesByStage[item._id] = item.count;
      });

      // 4. Active sequencing runs
      const activeSequencingRuns = await SequencingRun.countDocuments({
        status: { $in: ['scheduled', 'in_progress'] },
      });

      // 5. Reports delivered this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const reportsDeliveredThisMonth = await Report.countDocuments({
        status: 'delivered',
        deliveredAt: { $gte: startOfMonth },
      });
      const totalReports = await Report.countDocuments();

      // 6. Requests over last 6 months for chart
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const monthlyRequests = await Request.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const found = monthlyRequests.find(
          (item) => item._id.year === y && item._id.month === m
        );
        chartData.push({
          month: `${monthNames[m - 1]} ${y}`,
          requests: found ? found.count : 0,
        });
      }

      // Recent activity records
      const recentRequests = await Request.find()
        .populate('requester', 'name email organization')
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        role: 'admin',
        data: {
          totalUsers,
          activeUsers,
          totalRequests: await Request.countDocuments(),
          totalSamples: await Sample.countDocuments(),
          requestsByStatus,
          samplesByStage,
          activeSequencingRuns,
          reportsDeliveredThisMonth,
          totalReports,
          monthlyChart: chartData,
          recentRequests,
        },
      });
    }

    if (role === 'lab_staff') {
      // Lab Staff actionable queue counts
      const pendingReviews = await Request.countDocuments({
        status: { $in: ['submitted', 'under_review'] },
      });
      const samplesAwaitingQC = await Sample.countDocuments({ currentStage: 'registered' });
      const samplesInQC = await Sample.countDocuments({ currentStage: 'qc' });
      const samplesAwaitingSequencing = await Sample.countDocuments({ currentStage: 'qc' });
      const activeSequencingRuns = await SequencingRun.countDocuments({
        status: { $in: ['scheduled', 'in_progress'] },
      });
      const samplesAwaitingAnalysis = await Sample.countDocuments({ currentStage: 'sequencing' });
      const reportsAwaitingDelivery = await Report.countDocuments({
        status: { $in: ['draft', 'final'] },
      });
      const samplesReportReady = await Sample.countDocuments({ currentStage: 'report_ready' });

      // Actionable Queues
      const requestsToReview = await Request.find({ status: { $in: ['submitted', 'under_review'] } })
        .populate('requester', 'name email organization')
        .sort({ priority: -1, createdAt: 1 })
        .limit(6);

      const samplesQueue = await Sample.find({ currentStage: { $in: ['registered', 'qc', 'report_ready'] } })
        .populate('request', 'requestCode title priority')
        .sort({ createdAt: -1 })
        .limit(6);

      const activeRuns = await SequencingRun.find({ status: { $in: ['scheduled', 'in_progress'] } })
        .populate('samples', 'sampleCode')
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        role: 'lab_staff',
        data: {
          pendingReviews,
          samplesAwaitingQC,
          samplesInQC,
          samplesAwaitingSequencing,
          activeSequencingRuns,
          samplesAwaitingAnalysis,
          reportsAwaitingDelivery,
          samplesReportReady,
          queues: {
            requestsToReview,
            samplesQueue,
            activeRuns,
          },
        },
      });
    }

    // Role: requester
    if (role === 'requester') {
      const userRequests = await Request.find({ requester: userId }).select('_id');
      const requestIds = userRequests.map((r) => r._id);

      const totalRequests = userRequests.length;
      const activeRequestsCount = await Request.countDocuments({
        requester: userId,
        status: { $nin: ['completed', 'rejected'] },
      });

      const totalSamples = await Sample.countDocuments({ request: { $in: requestIds } });
      const samplesInProgressCount = await Sample.countDocuments({
        request: { $in: requestIds },
        currentStage: { $ne: 'delivered' },
      });

      const availableReportsCount = await Report.countDocuments({
        request: { $in: requestIds },
        status: 'delivered',
      });

      // Recent requester items
      const recentRequests = await Request.find({ requester: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      const activeSamples = await Sample.find({
        request: { $in: requestIds },
        currentStage: { $ne: 'delivered' },
      })
        .populate('request', 'requestCode title')
        .sort({ updatedAt: -1 })
        .limit(5);

      const availableReports = await Report.find({
        request: { $in: requestIds },
        status: 'delivered',
      })
        .populate('sample', 'sampleCode sampleType')
        .populate('request', 'requestCode title')
        .sort({ deliveredAt: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        role: 'requester',
        data: {
          totalRequests,
          activeRequestsCount,
          totalSamples,
          samplesInProgressCount,
          availableReportsCount,
          recentRequests,
          activeSamples,
          availableReports,
        },
      });
    }

    res.status(400).json({ success: false, message: 'Unrecognized user role' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary };
