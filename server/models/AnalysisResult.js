const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema(
  {
    sample: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sample',
      required: true,
    },
    sequencingRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SequencingRun',
      default: null,
    },
    pipeline: {
      type: String,
      required: [true, 'Bioinformatics pipeline is required'],
      trim: true,
    },
    referenceGenome: {
      type: String,
      default: 'GRCh38',
      trim: true,
    },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'failed'],
      default: 'queued',
    },
    resultSummary: {
      type: String,
      default: '',
    },
    resultFilePath: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
