const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
      default: '',
    },
    sampleType: {
      type: String,
      enum: ['DNA', 'RNA', 'Blood', 'Tissue', 'Other'],
      required: [true, 'Sample type is required'],
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent'],
      default: 'routine',
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'completed'],
      default: 'submitted',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Request', requestSchema);
