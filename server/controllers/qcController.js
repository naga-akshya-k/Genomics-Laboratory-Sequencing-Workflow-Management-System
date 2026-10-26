const QCRecord = require('../models/QCRecord');
const Sample = require('../models/Sample');

// @desc Get QC records with filtering and pagination
// @route GET /api/v1/qc
// @access Lab Staff, Admin
const getAllQCRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.result) {
      query.result = req.query.result;
    }

    if (req.query.sample) {
      query.sample = req.query.sample;
    }

    const total = await QCRecord.countDocuments(query);
    const records = await QCRecord.find(query)
      .populate({
        path: 'sample',
        select: 'sampleCode sampleType currentStage request',
        populate: {
          path: 'request',
          select: 'requestCode title priority',
        },
      })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: records,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new QC record
// @route POST /api/v1/qc
// @access Lab Staff, Admin
const createQCRecord = async (req, res, next) => {
  try {
    const {
      sampleId,
      concentrationNgUl,
      purity260_280,
      purity260_230,
      volumeUl,
      integrityNumber,
      result,
      notes,
    } = req.body;

    const sample = await Sample.findById(sampleId);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found. A valid sample is required to log QC.',
      });
    }

    const record = await QCRecord.create({
      sample: sample._id,
      concentrationNgUl,
      purity260_280,
      purity260_230,
      volumeUl,
      integrityNumber: integrityNumber !== undefined && integrityNumber !== '' ? integrityNumber : null,
      result: result || 'pending',
      performedBy: req.user._id,
      notes: notes || '',
    });

    // Advance sample stage to qc if currently registered
    if (sample.currentStage === 'registered') {
      sample.currentStage = 'qc';
      await sample.save();
    }

    const populated = await QCRecord.findById(record._id)
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Quality control record logged successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get QC record by ID
// @route GET /api/v1/qc/:id
// @access Lab Staff, Admin
const getQCRecordById = async (req, res, next) => {
  try {
    const record = await QCRecord.findById(req.params.id)
      .populate({
        path: 'sample',
        populate: {
          path: 'request',
          select: 'requestCode title requester priority',
        },
      })
      .populate('performedBy', 'name email role');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'QC Record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update QC record
// @route PATCH /api/v1/qc/:id
// @access Lab Staff, Admin
const updateQCRecord = async (req, res, next) => {
  try {
    const {
      concentrationNgUl,
      purity260_280,
      purity260_230,
      volumeUl,
      integrityNumber,
      result,
      notes,
    } = req.body;

    const record = await QCRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'QC Record not found',
      });
    }

    if (concentrationNgUl !== undefined) record.concentrationNgUl = concentrationNgUl;
    if (purity260_280 !== undefined) record.purity260_280 = purity260_280;
    if (purity260_230 !== undefined) record.purity260_230 = purity260_230;
    if (volumeUl !== undefined) record.volumeUl = volumeUl;
    if (integrityNumber !== undefined) record.integrityNumber = integrityNumber;
    if (result !== undefined) record.result = result;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    const populated = await QCRecord.findById(record._id)
      .populate('sample', 'sampleCode sampleType currentStage')
      .populate('performedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'QC Record updated successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllQCRecords,
  createQCRecord,
  getQCRecordById,
  updateQCRecord,
};
