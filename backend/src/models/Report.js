const mongoose = require('mongoose');
const {
  REPORT_CONTENT_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES
} = require('@pharmalink/shared');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contentType: {
      type: String,
      required: true,
      enum: REPORT_CONTENT_TYPES,
      index: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    reason: {
      type: String,
      required: true,
      enum: REPORT_REASONS
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'pending',
      index: true
    },
    resolutionAction: {
      type: String,
      enum: ['none', 'content_removed', 'user_warned', 'user_suspended'],
      default: 'none'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate pending reports by same user on same content
reportSchema.index({ reporter: 1, contentId: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ contentType: 1, status: 1 });

reportSchema.methods.toSafeReport = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
