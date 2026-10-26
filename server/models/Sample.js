const mongoose = require('mongoose');

const sampleSchema = new mongoose.Schema(
  {
    sampleCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
    },
    sampleType: {
      type: String,
      required: true,
      trim: true,
    },
    collectionDate: {
      type: Date,
      default: Date.now,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    currentStage: {
      type: String,
      enum: ['registered', 'qc', 'sequencing', 'analysis', 'report_ready', 'delivered'],
      default: 'registered',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sample', sampleSchema);
