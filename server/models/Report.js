const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportCode: {
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
    sample: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sample',
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    pdfPath: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'final', 'delivered'],
      default: 'draft',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
