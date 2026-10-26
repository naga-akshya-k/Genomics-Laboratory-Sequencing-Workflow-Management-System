const SequencingRun = require('../models/SequencingRun');
const Sample = require('../models/Sample');
const { generateId } = require('../utils/idGenerator');

// @desc Get all sequencing runs
// @route GET /api/v1/sequencing-runs
// @access Lab Staff, Admin
const getAllRuns = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.platform) {
      query.platform = req.query.platform;
    }

    if (req.query.runType) {
      query.runType = req.query.runType;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ runCode: searchRegex }, { platform: searchRegex }, { runType: searchRegex }];
    }

    const total = await SequencingRun.countDocuments(query);
    const runs = await SequencingRun.find(query)
      .populate('samples', 'sampleCode sampleType currentStage request')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: runs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new sequencing run
// @route POST /api/v1/sequencing-runs
// @access Lab Staff, Admin
const createRun = async (req, res, next) => {
  try {
    const { sampleIds, platform, runType, readLength, targetCoverage, status } = req.body;

    const runCode = await generateId(SequencingRun, 'RUN');

    const run = await SequencingRun.create({
      runCode,
      samples: sampleIds || [],
      platform,
      runType,
      readLength: readLength || '2x150bp',
      targetCoverage: targetCoverage || 30,
      status: status || 'scheduled',
      performedBy: req.user._id,
    });

    // Advance all batched samples to 'sequencing' stage if currently behind
    if (sampleIds && sampleIds.length > 0) {
      await Sample.updateMany(
        {
          _id: { $in: sampleIds },
          currentStage: { $in: ['registered', 'qc'] },
        },
        { $set: { currentStage: 'sequencing' } }
      );
    }

    const populated = await SequencingRun.findById(run._id)
      .populate('samples', 'sampleCode sampleType currentStage')
      .populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Sequencing run scheduled successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get sequencing run by ID
// @route GET /api/v1/sequencing-runs/:id
// @access Lab Staff, Admin
const getRunById = async (req, res, next) => {
  try {
    const run = await SequencingRun.findById(req.params.id)
      .populate({
        path: 'samples',
        populate: {
          path: 'request',
          select: 'requestCode title priority requester',
        },
      })
      .populate('performedBy', 'name email role');

    if (!run) {
      return res.status(404).json({
        success: false,
        message: 'Sequencing run not found',
      });
    }

    res.status(200).json({
      success: true,
      data: run,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update sequencing run
// @route PATCH /api/v1/sequencing-runs/:id
// @access Lab Staff, Admin
const updateRunStatus = async (req, res, next) => {
  try {
    const { status, platform, runType, readLength, targetCoverage, sampleIds } = req.body;

    const run = await SequencingRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({
        success: false,
        message: 'Sequencing run not found',
      });
    }

    if (status) run.status = status;
    if (platform) run.platform = platform;
    if (runType) run.runType = runType;
    if (readLength) run.readLength = readLength;
    if (targetCoverage !== undefined) run.targetCoverage = targetCoverage;
    if (sampleIds) run.samples = sampleIds;

    await run.save();

    // If run completed, transition sample stages to analysis if ready
    if (status === 'completed' && run.samples && run.samples.length > 0) {
      await Sample.updateMany(
        {
          _id: { $in: run.samples },
          currentStage: 'sequencing',
        },
        { $set: { currentStage: 'analysis' } }
      );
    }

    const populated = await SequencingRun.findById(run._id)
      .populate('samples', 'sampleCode sampleType currentStage')
      .populate('performedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Sequencing run updated successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRuns,
  createRun,
  getRunById,
  updateRunStatus,
};
