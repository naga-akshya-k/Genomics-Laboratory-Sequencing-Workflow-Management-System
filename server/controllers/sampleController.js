const Sample = require('../models/Sample');
const Request = require('../models/Request');
const QCRecord = require('../models/QCRecord');
const SequencingRun = require('../models/SequencingRun');
const AnalysisResult = require('../models/AnalysisResult');
const Report = require('../models/Report');
const { generateId } = require('../utils/idGenerator');

// @desc Get samples with role scoping, pagination, stage filter, and search
// @route GET /api/v1/samples
// @access Private
const getAllSamples = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Requesters can only see samples linked to their requests
    if (req.user.role === 'requester') {
      const userRequests = await Request.find({ requester: req.user._id }).select('_id');
      const requestIds = userRequests.map((r) => r._id);
      query.request = { $in: requestIds };
    }

    if (req.query.currentStage) {
      query.currentStage = req.query.currentStage;
    }

    if (req.query.request) {
      query.request = req.query.request;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ sampleCode: searchRegex }, { sampleType: searchRegex }];
    }

    const total = await Sample.countDocuments(query);
    const samples = await Sample.find(query)
      .populate({
        path: 'request',
        select: 'requestCode title sampleType priority status requester',
        populate: {
          path: 'requester',
          select: 'name email organization',
        },
      })
      .populate('registeredBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: samples,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Register a new sample
// @route POST /api/v1/samples
// @access Lab Staff, Admin
const createSample = async (req, res, next) => {
  try {
    const { requestId, sampleType, collectionDate, receivedDate, currentStage } = req.body;

    const requestDoc = await Request.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found. A valid request is required to register a sample.',
      });
    }

    const sampleCode = await generateId(Sample, 'SMP');

    const sample = await Sample.create({
      sampleCode,
      request: requestDoc._id,
      sampleType: sampleType || requestDoc.sampleType,
      collectionDate: collectionDate || Date.now(),
      receivedDate: receivedDate || Date.now(),
      currentStage: currentStage || 'registered',
      registeredBy: req.user._id,
    });

    // If request was approved, move to in_progress
    if (requestDoc.status === 'approved') {
      requestDoc.status = 'in_progress';
      await requestDoc.save();
    }

    const populated = await Sample.findById(sample._id)
      .populate('request', 'requestCode title sampleType priority status')
      .populate('registeredBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Sample registered successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get sample by ID with complete downstream traceability
// @route GET /api/v1/samples/:id
// @access Private (Requester must own sample's request, or staff/admin)
const getSampleById = async (req, res, next) => {
  try {
    const sample = await Sample.findById(req.params.id)
      .populate({
        path: 'request',
        populate: {
          path: 'requester',
          select: 'name email organization phone',
        },
      })
      .populate('registeredBy', 'name email role');

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found',
      });
    }

    // Role check
    if (
      req.user.role === 'requester' &&
      sample.request.requester._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view samples from other investigators.',
      });
    }

    // Traceability links
    const [qcRecords, sequencingRuns, analysisResults, reports] = await Promise.all([
      QCRecord.find({ sample: sample._id }).populate('performedBy', 'name email').sort({ createdAt: -1 }),
      SequencingRun.find({ samples: sample._id }).populate('performedBy', 'name email').sort({ createdAt: -1 }),
      AnalysisResult.find({ sample: sample._id }).populate('performedBy', 'name email').sort({ createdAt: -1 }),
      Report.find({ sample: sample._id }).populate('generatedBy', 'name email').sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...sample.toObject(),
        qcRecords,
        sequencingRuns,
        analysisResults,
        reports,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update sample stage
// @route PATCH /api/v1/samples/:id/stage
// @access Lab Staff, Admin
const updateSampleStage = async (req, res, next) => {
  try {
    const { currentStage } = req.body;

    const validStages = ['registered', 'qc', 'sequencing', 'analysis', 'report_ready', 'delivered'];
    if (!validStages.includes(currentStage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Must be one of: ${validStages.join(', ')}`,
      });
    }

    const sample = await Sample.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found',
      });
    }

    sample.currentStage = currentStage;
    await sample.save();

    const populated = await Sample.findById(sample._id)
      .populate('request', 'requestCode title sampleType')
      .populate('registeredBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Sample stage advanced to ${currentStage}`,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSamples,
  createSample,
  getSampleById,
  updateSampleStage,
};
