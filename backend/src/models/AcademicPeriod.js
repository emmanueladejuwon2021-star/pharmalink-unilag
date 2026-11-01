const mongoose = require('mongoose');
const {
  ELIGIBLE_LEVELS,
  SEMESTERS,
  isValidAcademicSession
} = require('@pharmalink/shared');

/**
 * EPIC-004: Academic Structure and Session Management
 * Tracks the academic period each verified student belongs to:
 * which session (e.g. 2025/2026) and semester they were last promoted in,
 * their current level, and their progression history.
 */
const progressionEntrySchema = new mongoose.Schema(
  {
    session: { type: String, required: true },
    semester: { type: String, required: true },
    fromLevel: { type: String, required: true },
    toLevel: { type: String, required: true },
    promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true, default: '' },
    promotedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const academicPeriodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    currentLevel: {
      type: String,
      required: true,
      enum: {
        values: ELIGIBLE_LEVELS,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      }
    },
    session: {
      type: String,
      required: [true, 'Academic session is required'],
      validate: {
        validator: (value) => isValidAcademicSession(value),
        message: 'Academic session must be a valid UNILAG AY string like 2025/2026'
      }
    },
    semester: {
      type: String,
      required: true,
      enum: {
        values: SEMESTERS,
        message: `Semester must be one of: ${SEMESTERS.join(', ')}`
      }
    },
    // The session the student was admitted/registered at (used for continuity)
    admissionSession: {
      type: String,
      validate: {
        validator: (value) => !value || isValidAcademicSession(value),
        message: 'Admission session must be a valid UNILAG AY string'
      }
    },
    progressionHistory: {
      type: [progressionEntrySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

academicPeriodSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const AcademicPeriod = mongoose.model('AcademicPeriod', academicPeriodSchema);

module.exports = AcademicPeriod;
