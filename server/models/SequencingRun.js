const mongoose = require('mongoose');

const sequencingRunSchema = new mongoose.Schema(
  {
    runCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    samples: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sample',
      },
    ],
    platform: {
      type: String,
      enum: ['Illumina NovaSeq', 'Illumina MiSeq', 'Oxford Nanopore', 'PacBio'],
      required: [true, 'Sequencing platform is required'],
    },
    runType: {
      type: String,
      enum: ['WGS', 'WES', 'RNA-Seq', 'Targeted Panel'],
      required: [true, 'Run type is required'],
    },
    readLength: {
      type: String,
      default: '2x150bp',
    },
    targetCoverage: {
      type: Number,
      default: 30, // 30x, etc.
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'failed'],
      default: 'scheduled',
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

module.exports = mongoose.model('SequencingRun', sequencingRunSchema);
