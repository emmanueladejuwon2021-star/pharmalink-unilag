const mongoose = require('mongoose');
const { SEMESTERS, isValidAcademicSession } = require('@pharmalink/shared');

const academicSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Academic session name is required (e.g., 2024/2025)'],
      unique: true,
      trim: true,
      validate: {
        validator: isValidAcademicSession,
        message: 'Session name must be in format YYYY/YYYY (e.g. 2024/2025)'
      }
    },
    currentSemester: {
      type: String,
      enum: {
        values: SEMESTERS,
        message: 'Current semester must be First Semester or Second Semester'
      },
      default: 'First Semester'
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// If this session is marked as current, deactivate isCurrent on all other sessions
academicSessionSchema.pre('save', async function (next) {
  if (this.isModified('isCurrent') && this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);

module.exports = AcademicSession;
