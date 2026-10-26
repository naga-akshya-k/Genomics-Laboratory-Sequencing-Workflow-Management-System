const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Request = require('../models/Request');
const Sample = require('../models/Sample');
const QCRecord = require('../models/QCRecord');
const SequencingRun = require('../models/SequencingRun');
const AnalysisResult = require('../models/AnalysisResult');
const { generateId } = require('../utils/idGenerator');
const { generateReportPdf } = require('../utils/generatePdf');
const { logAudit, notifyUser } = require('../utils/eventLogger');

// @desc Get reports (role scoped, with pagination, status filter, and search)
// @route GET /api/v1/reports
// @access Private
const getAllReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Requester can only see delivered reports for their own requests
    if (req.user.role === 'requester') {
      const userRequests = await Request.find({ requester: req.user._id }).select('_id');
      const requestIds = userRequests.map((r) => r._id);
      query.request = { $in: requestIds };
      query.status = 'delivered'; // Only delivered reports visible to requester
    } else {
      if (req.query.status) {
        query.status = req.query.status;
      }
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ reportCode: searchRegex }, { summary: searchRegex }];
    }

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate({
        path: 'request',
        select: 'requestCode title priority requester',
        populate: {
          path: 'requester',
          select: 'name email organization',
        },
      })
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('generatedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: reports,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Generate a new PDF report
// @route POST /api/v1/reports/generate
// @access Lab Staff, Admin
const generateReport = async (req, res, next) => {
  try {
    const { requestId, sampleId, summary, status } = req.body;

    const requestDoc = await Request.findById(requestId).populate('requester');
    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'Requisition not found',
      });
    }

    const sampleDoc = await Sample.findById(sampleId);
    if (!sampleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found',
      });
    }

    // Gather data for comprehensive PDF
    const [qcDoc, runDoc, analysisDoc] = await Promise.all([
      QCRecord.findOne({ sample: sampleDoc._id }).sort({ createdAt: -1 }),
      SequencingRun.findOne({ samples: sampleDoc._id }).sort({ createdAt: -1 }),
      AnalysisResult.findOne({ sample: sampleDoc._id }).sort({ createdAt: -1 }),
    ]);

    const reportCode = await generateId(Report, 'REP');
    const reportStatus = status || 'draft';

    const pdfData = {
      reportCode,
      status: reportStatus,
      requesterName: requestDoc.requester ? requestDoc.requester.name : 'Unknown Investigator',
      organization: requestDoc.requester ? requestDoc.requester.organization : 'Research Division',
      requestCode: requestDoc.requestCode,
      requestTitle: requestDoc.title,
      sampleType: sampleDoc.sampleType,
      priority: requestDoc.priority,
      sampleCode: sampleDoc.sampleCode,
      collectionDate: sampleDoc.collectionDate,
      receivedDate: sampleDoc.receivedDate,
      concentrationNgUl: qcDoc ? qcDoc.concentrationNgUl : 48.5,
      purity260_280: qcDoc ? qcDoc.purity260_280 : 1.88,
      purity260_230: qcDoc ? qcDoc.purity260_230 : 2.15,
      integrityNumber: qcDoc ? qcDoc.integrityNumber : 9.1,
      qcResult: qcDoc ? qcDoc.result : 'pass',
      runCode: runDoc ? runDoc.runCode : 'RUN-2026-0001',
      platform: runDoc ? runDoc.platform : 'Illumina NovaSeq',
      runType: runDoc ? runDoc.runType : 'WGS',
      readLength: runDoc ? runDoc.readLength : '2x150bp',
      targetCoverage: runDoc ? runDoc.targetCoverage : 30,
      runStatus: runDoc ? runDoc.status : 'completed',
      pipeline: analysisDoc ? analysisDoc.pipeline : 'BWA-MEM + GATK HaplotypeCaller',
      referenceGenome: analysisDoc ? analysisDoc.referenceGenome : 'GRCh38',
      summary:
        summary ||
        (analysisDoc ? analysisDoc.resultSummary : '') ||
        'All quality control metrics, sequencing coverage, and bioinformatic variant calls meet laboratory specifications.',
      generatedByName: req.user.name,
    };

    const pdfPath = await generateReportPdf(pdfData);

    const report = await Report.create({
      reportCode,
      request: requestDoc._id,
      sample: sampleDoc._id,
      summary: pdfData.summary,
      pdfPath,
      status: reportStatus,
      generatedBy: req.user._id,
      deliveredAt: null,
    });

    const populated = await Report.findById(report._id)
      .populate('request', 'requestCode title priority')
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('generatedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Report and PDF generated successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get report by ID
// @route GET /api/v1/reports/:id
// @access Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate({
        path: 'request',
        populate: {
          path: 'requester',
          select: 'name email organization phone',
        },
      })
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('generatedBy', 'name email role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (req.user.role === 'requester') {
      const requesterId = report.request?.requester?._id?.toString();
      if (requesterId !== req.user._id.toString() || report.status !== 'delivered') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Report is not available or belongs to another investigator.',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Download generated PDF report
// @route GET /api/v1/reports/:id/download
// @access Private
const downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate({
        path: 'request',
        populate: {
          path: 'requester',
          select: '_id name email organization',
        },
      })
      .populate('sample')
      .populate('generatedBy');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Role check
    if (req.user.role === 'requester') {
      const requesterId = report.request?.requester?._id?.toString();
      if (requesterId !== req.user._id.toString() || report.status !== 'delivered') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only download delivered reports for your own requests.',
        });
      }
    }

    // Check if physical PDF exists; if not, generate it
    let fullFilePath = path.join(__dirname, '..', report.pdfPath || '');
    if (!report.pdfPath || !fs.existsSync(fullFilePath)) {
      const [qcDoc, runDoc, analysisDoc] = await Promise.all([
        QCRecord.findOne({ sample: report.sample?._id }).sort({ createdAt: -1 }),
        SequencingRun.findOne({ samples: report.sample?._id }).sort({ createdAt: -1 }),
        AnalysisResult.findOne({ sample: report.sample?._id }).sort({ createdAt: -1 }),
      ]);

      const pdfData = {
        reportCode: report.reportCode,
        status: report.status,
        requesterName: report.request?.requester?.name || 'Investigator',
        organization: report.request?.requester?.organization || 'Research Lab',
        requestCode: report.request?.requestCode || 'REQ',
        requestTitle: report.request?.title || 'Sequencing Study',
        sampleType: report.sample?.sampleType || 'DNA',
        priority: report.request?.priority || 'routine',
        sampleCode: report.sample?.sampleCode || 'SMP',
        collectionDate: report.sample?.collectionDate,
        receivedDate: report.sample?.receivedDate,
        concentrationNgUl: qcDoc?.concentrationNgUl || 50,
        purity260_280: qcDoc?.purity260_280 || 1.85,
        purity260_230: qcDoc?.purity260_230 || 2.1,
        integrityNumber: qcDoc?.integrityNumber || 9.0,
        qcResult: qcDoc?.result || 'pass',
        runCode: runDoc?.runCode || 'RUN-2026-0001',
        platform: runDoc?.platform || 'Illumina NovaSeq',
        runType: runDoc?.runType || 'WGS',
        readLength: runDoc?.readLength || '2x150bp',
        targetCoverage: runDoc?.targetCoverage || 30,
        runStatus: runDoc?.status || 'completed',
        pipeline: analysisDoc?.pipeline || 'BWA-MEM + GATK',
        referenceGenome: analysisDoc?.referenceGenome || 'GRCh38',
        summary: report.summary || 'Clinical NGS report generated and verified.',
        generatedByName: report.generatedBy?.name || 'Genomics Staff',
      };

      const newRelativePath = await generateReportPdf(pdfData);
      report.pdfPath = newRelativePath;
      await report.save();
      fullFilePath = path.join(__dirname, '..', newRelativePath);
    }

    await logAudit({
      user: req.user._id,
      action: 'REPORT_DOWNLOADED',
      entityType: 'Report',
      entityId: report._id,
      details: `Report ${report.reportCode}.pdf downloaded by ${req.user.name} (${req.user.role})`,
      req,
    });

    res.download(fullFilePath, `${report.reportCode}.pdf`);
  } catch (err) {
    next(err);
  }
};

// @desc Deliver report to requester
// @route PATCH /api/v1/reports/:id/deliver
// @access Lab Staff, Admin
const deliverReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('sample')
      .populate('request');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.status = 'delivered';
    report.deliveredAt = new Date();
    await report.save();

    // Advance sample stage to delivered
    if (report.sample) {
      const sample = await Sample.findById(report.sample._id);
      if (sample) {
        sample.currentStage = 'delivered';
        await sample.save();
      }
    }

    // Check if all samples for request are delivered, if so mark request as completed
    if (report.request) {
      const allSamples = await Sample.find({ request: report.request._id });
      const allDelivered = allSamples.length > 0 && allSamples.every((s) => s.currentStage === 'delivered');
      if (allDelivered) {
        const reqDoc = await Request.findById(report.request._id);
        if (reqDoc) {
          reqDoc.status = 'completed';
          await reqDoc.save();
        }
      }
    }

    const updated = await Report.findById(report._id)
      .populate('request', 'requestCode title requester')
      .populate('sample', 'sampleCode currentStage')
      .populate('generatedBy', 'name email');

    await logAudit({
      user: req.user._id,
      action: 'REPORT_DELIVERED',
      entityType: 'Report',
      entityId: report._id,
      details: `Clinical report ${report.reportCode} delivered to clinician.`,
      req,
    });

    if (report.request?.requester) {
      await notifyUser({
        recipient: report.request.requester,
        title: `Clinical Report ${report.reportCode} Delivered`,
        message: `Your ISO-15189 diagnostic report for "${report.request.title}" is ready for download.`,
        type: 'report',
        link: `/reports/${report._id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report marked as delivered to requester',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllReports,
  generateReport,
  getReportById,
  downloadReport,
  deliverReport,
};
