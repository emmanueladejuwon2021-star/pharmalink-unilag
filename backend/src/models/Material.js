const mongoose = require('mongoose');
const {
  ELIGIBLE_LEVELS,
  SEMESTERS,
  DEPARTMENTS,
  MATERIAL_TYPES,
  isValidCourseCode,
  isValidAcademicSession,
  isValidDepartmentCode
} = require('@pharmalink/shared');

const deptCodes = DEPARTMENTS ? DEPARTMENTS.map((d) => d.code) : ['CPH', 'PCH', 'PCT', 'PCG', 'PCL'];

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Material uploader is required'],
      index: true
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
      validate: {
        validator: function (val) {
          if (!val) return false;
          return isValidCourseCode(val);
        },
        message: 'Invalid course code format (expected e.g. "PCH 301")'
      },
      index: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      uppercase: true,
      enum: {
        values: deptCodes,
        message: `Department must be one of: ${deptCodes.join(', ')}`
      },
      index: true
    },
    level: {
      type: String,
      required: [true, 'Academic level is required'],
      enum: {
        values: ELIGIBLE_LEVELS,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      },
      index: true
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      enum: {
        values: SEMESTERS,
        message: 'Semester must be First Semester or Second Semester'
      },
      index: true
    },
    materialType: {
      type: String,
      required: [true, 'Material type is required'],
      enum: {
        values: MATERIAL_TYPES,
        message: `Material type must be one of: ${MATERIAL_TYPES.join(', ')}`
      },
      index: true
    },
    academicSession: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          if (!val) return true;
          return isValidAcademicSession(val);
        },
        message: 'Academic session must be formatted as YYYY/YYYY (e.g. 2024/2025)'
      },
      default: null,
      index: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
      min: [0, 'File size cannot be negative']
    },
    mimeType: {
      type: String,
      trim: true,
      default: 'application/pdf'
    },
    downloadsCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isVerifiedOfficial: {
      type: Boolean,
      default: false,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
materialSchema.index({ isDeleted: 1, department: 1, level: 1, createdAt: -1 });
materialSchema.index({ isDeleted: 1, courseCode: 1, createdAt: -1 });
materialSchema.index({ isDeleted: 1, materialType: 1, createdAt: -1 });
materialSchema.index({ isDeleted: 1, downloadsCount: -1 });
materialSchema.index({ isDeleted: 1, viewsCount: -1 });
materialSchema.index({ isDeleted: 1, likesCount: -1 });
materialSchema.index({ title: 'text', description: 'text', courseCode: 'text' });

/**
 * Format material for safe delivery with safe uploader details
 */
materialSchema.methods.toSafeMaterial = function (currentUserId = null) {
  const uploaderData =
    this.uploader && typeof this.uploader === 'object' && this.uploader.fullName
      ? {
          _id: this.uploader._id,
          fullName: this.uploader.fullName,
          level: this.uploader.level,
          department: this.uploader.department || null,
          verificationStatus: this.uploader.verificationStatus || 'unverified',
          role: this.uploader.role,
          avatar: this.uploader.avatar || '',
          matricNumber: this.uploader.matricNumber
        }
      : this.uploader;

  const isUploader =
    currentUserId &&
    this.uploader &&
    ((this.uploader._id && this.uploader._id.toString() === currentUserId.toString()) ||
      this.uploader.toString() === currentUserId.toString());

  return {
    _id: this._id,
    title: this.title,
    description: this.description || '',
    uploader: uploaderData,
    isUploader: Boolean(isUploader),
    courseCode: this.courseCode,
    department: this.department,
    level: this.level,
    semester: this.semester,
    materialType: this.materialType,
    academicSession: this.academicSession || null,
    fileUrl: this.fileUrl,
    fileName: this.fileName,
    fileSizeBytes: this.fileSizeBytes || 0,
    mimeType: this.mimeType || 'application/pdf',
    downloadsCount: this.downloadsCount || 0,
    viewsCount: this.viewsCount || 0,
    likesCount: this.likesCount || 0,
    isVerifiedOfficial: Boolean(this.isVerifiedOfficial),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Material = mongoose.model('Material', materialSchema);

module.exports = Material;
