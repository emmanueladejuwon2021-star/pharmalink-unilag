const mongoose = require('mongoose');
const { VERIFICATION_DOC_TYPES, VERIFICATION_STATUS } = require('@pharmalink/shared');

const verificationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    documentType: {
      type: String,
      required: [true, 'Please select your document type'],
      enum: {
        values: VERIFICATION_DOC_TYPES,
        message: 'Invalid document type selected'
      }
    },
    documentUrl: {
      type: String,
      required: [true, 'Document image or proof is required']
    },
    studentNote: {
      type: String,
      maxlength: [500, 'Student note cannot exceed 500 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewerNote: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

module.exports = VerificationRequest;
