const mongoose = require('mongoose');

const qcRecordSchema = new mongoose.Schema(
  {
    sample: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sample',
      required: true,
    },
    concentrationNgUl: {
      type: Number,
      required: [true, 'Concentration (ng/µL) is required'],
    },
    purity260_280: {
      type: Number,
      required: [true, 'A260/A280 purity ratio is required'],
    },
    purity260_230: {
      type: Number,
      required: [true, 'A260/A230 purity ratio is required'],
    },
    volumeUl: {
      type: Number,
      required: [true, 'Volume (µL) is required'],
    },
    integrityNumber: {
      type: Number,
      default: null, // RIN (RNA Integrity Number) or DIN (DNA Integrity Number)
    },
    result: {
      type: String,
      enum: ['pending', 'pass', 'fail', 'repeat'],
      default: 'pending',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QCRecord', qcRecordSchema);
