const mongoose = require('mongoose');
const { ELIGIBLE_LEVELS, isValidAcademicSession } = require('@pharmalink/shared');

/**
 * EPIC-004: Academic Structure and Session Management
 * Faculty of Pharmacy course catalogue. Courses are scoped to a level
 * (200L - 500L) so materials, posts and quizzes can reference real units.
 */
const academicCourseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2,4}\d{2,4}[A-Z]?$/, 'Course code must look like PHR101, PYC202 or BPH301A']
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters'],
      maxlength: [120, 'Course title must be at most 120 characters']
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: {
        values: ELIGIBLE_LEVELS,
        message: 'Course level must be one of: 200L, 300L, 400L, 500L'
      }
    },
    unit: {
      type: Number,
      default: 3,
      min: [1, 'Unit value must be at least 1'],
      max: [6, 'Unit value cannot exceed 6']
    },
    semester: {
      type: String,
      enum: {
        values: ['First Semester', 'Second Semester'],
        message: 'Semester must be First Semester or Second Semester'
      }
    },
    department: {
      type: String,
      trim: true,
      default: 'Pharmacy'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Course codes are unique across the catalogue
academicCourseSchema.index({ code: 1 }, { unique: true });
// Fast lookup of all courses for a given level
academicCourseSchema.index({ level: 1, isActive: 1 });

academicCourseSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const AcademicCourse = mongoose.model('AcademicCourse', academicCourseSchema);

module.exports = AcademicCourse;
