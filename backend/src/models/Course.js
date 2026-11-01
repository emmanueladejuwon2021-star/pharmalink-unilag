const mongoose = require('mongoose');
const {
  ELIGIBLE_LEVELS,
  DEPARTMENTS,
  SEMESTERS,
  isValidCourseCode
} = require('@pharmalink/shared');

const deptCodes = DEPARTMENTS.map((d) => d.code);

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required (e.g. PCH 301)'],
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: isValidCourseCode,
        message: 'Course code must follow format: 3 letters, space, 3 digits (e.g. PCH 301)'
      }
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters']
    },
    department: {
      type: String,
      required: [true, 'Academic department is required'],
      enum: {
        values: deptCodes,
        message: `Department must be one of: ${deptCodes.join(', ')}`
      },
      index: true
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: {
        values: ELIGIBLE_LEVELS,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      },
      index: true
    },
    semester: {
      type: String,
      required: [true, 'Academic semester is required'],
      enum: {
        values: SEMESTERS,
        message: 'Semester must be First Semester or Second Semester'
      },
      index: true
    },
    units: {
      type: Number,
      required: [true, 'Credit units are required'],
      min: [1, 'Course credit units must be at least 1'],
      max: [6, 'Course credit units cannot exceed 6']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound index for academic searches
courseSchema.index({ level: 1, department: 1, semester: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
