const AnalysisResult = require('../models/AnalysisResult');
const Sample = require('../models/Sample');

// @desc Get all analysis records
// @route GET /api/v1/analysis
// @access Lab Staff, Admin
const getAllAnalysis = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.sample) {
      query.sample = req.query.sample;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ pipeline: searchRegex }, { referenceGenome: searchRegex }, { resultSummary: searchRegex }];
    }

    const total = await AnalysisResult.countDocuments(query);
    const results = await AnalysisResult.find(query)
      .populate({
        path: 'sample',
        select: 'sampleCode sampleType currentStage request',
        populate: {
          path: 'request',
          select: 'requestCode title priority requester',
        },
      })
      .populate('sequencingRun', 'runCode platform runType status')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: results,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new analysis record with optional file attachment
// @route POST /api/v1/analysis
// @access Lab Staff, Admin
const createAnalysis = async (req, res, next) => {
  try {
    const { sampleId, sequencingRunId, pipeline, referenceGenome, status, resultSummary } = req.body;

    const sample = await Sample.findById(sampleId);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found. A valid sample is required.',
      });
    }

    let filePath = '';
    if (req.file) {
      filePath = `/uploads/analysis/${req.file.filename}`;
    }

    const analysis = await AnalysisResult.create({
      sample: sample._id,
      sequencingRun: sequencingRunId || null,
      pipeline: pipeline || 'BWA-MEM + GATK HaplotypeCaller',
      referenceGenome: referenceGenome || 'GRCh38',
      status: status || 'queued',
      resultSummary: resultSummary || '',
      resultFilePath: filePath,
      performedBy: req.user._id,
    });

    // Advance sample currentStage
    if (status === 'completed') {
      sample.currentStage = 'report_ready';
      await sample.save();
    } else if (sample.currentStage !== 'report_ready' && sample.currentStage !== 'delivered') {
      sample.currentStage = 'analysis';
      await sample.save();
    }

    const populated = await AnalysisResult.findById(analysis._id)
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('sequencingRun', 'runCode platform runType')
      .populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Bioinformatics analysis registered successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get analysis record by ID
// @route GET /api/v1/analysis/:id
// @access Lab Staff, Admin
const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await AnalysisResult.findById(req.params.id)
      .populate({
        path: 'sample',
        populate: {
          path: 'request',
          select: 'requestCode title requester priority',
        },
      })
      .populate('sequencingRun', 'runCode platform runType status')
      .populate('performedBy', 'name email role');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update analysis record
// @route PATCH /api/v1/analysis/:id
// @access Lab Staff, Admin
const updateAnalysis = async (req, res, next) => {
  try {
    const { pipeline, referenceGenome, status, resultSummary } = req.body;

    const analysis = await AnalysisResult.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found',
      });
    }

    if (pipeline) analysis.pipeline = pipeline;
    if (referenceGenome) analysis.referenceGenome = referenceGenome;
    if (resultSummary !== undefined) analysis.resultSummary = resultSummary;

    if (req.file) {
      analysis.resultFilePath = `/uploads/analysis/${req.file.filename}`;
    }

    if (status) {
      analysis.status = status;
      if (status === 'completed') {
        const sample = await Sample.findById(analysis.sample);
        if (sample && sample.currentStage !== 'delivered') {
          sample.currentStage = 'report_ready';
          await sample.save();
        }
      }
    }

    await analysis.save();

    const populated = await AnalysisResult.findById(analysis._id)
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('sequencingRun', 'runCode platform runType')
      .populate('performedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Analysis record updated successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllAnalysis,
  createAnalysis,
  getAnalysisById,
  updateAnalysis,
};
