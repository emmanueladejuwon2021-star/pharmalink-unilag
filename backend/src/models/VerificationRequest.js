const mongoose = require('mongoose');
const {
  ELIGIBLE_LEVELS,
  VERIFICATION_STATUS,
  VERIFICATION_DOC_TYPES
} = require('@pharmalink/shared');

const verificationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    matricNumber: {
      type: String,
      required: [true, 'Matriculation number is required'],
      trim: true
    },
    fullName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true
    },
    level: {
      type: String,
      required: [true, 'Academic level is required'],
      enum: {
        values: ELIGIBLE_LEVELS,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      }
    },
    documentType: {
      type: String,
      required: [true, 'Verification document type is required'],
      enum: {
        values: VERIFICATION_DOC_TYPES,
        message: `Document type must be one of: ${VERIFICATION_DOC_TYPES.join(', ')}`
      }
    },
    documentUrl: {
      type: String,
      required: [true, 'Document attachment/URL is required']
    },
    fileName: {
      type: String,
      trim: true
    },
    fileSize: {
      type: Number
    },
    status: {
      type: String,
      enum: [
        VERIFICATION_STATUS.PENDING,
        VERIFICATION_STATUS.VERIFIED,
        VERIFICATION_STATUS.REJECTED
      ],
      default: VERIFICATION_STATUS.PENDING,
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null
    },
    adminNotes: {
      type: String,
      trim: true,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active pending verification requests for same student
verificationRequestSchema.index(
  { user: 1, status: 1 },
  { partialFilterExpression: { status: 'pending' } }
);

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

module.exports = VerificationRequest;
