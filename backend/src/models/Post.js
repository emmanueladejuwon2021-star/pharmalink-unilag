const mongoose = require('mongoose');
const {
  POST_CATEGORIES,
  POST_AUDIENCE_LEVELS,
  isValidDepartmentCode
} = require('@pharmalink/shared');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
      index: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [3, 'Post content must be at least 3 characters'],
      maxlength: [3000, 'Post content cannot exceed 3000 characters']
    },
    category: {
      type: String,
      enum: {
        values: POST_CATEGORIES,
        message: 'Invalid post category'
      },
      default: 'Academic Discussion',
      index: true
    },
    level: {
      type: String,
      enum: {
        values: POST_AUDIENCE_LEVELS,
        message: 'Invalid target level'
      },
      default: 'All Levels',
      index: true
    },
    department: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      validate: {
        validator: function (val) {
          if (!val) return true;
          return isValidDepartmentCode(val);
        },
        message: 'Invalid pharmacy department code'
      },
      index: true
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      index: true
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        fileType: { type: String, trim: true },
        sizeBytes: { type: Number, default: 0 }
      }
    ],
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    },
    pinnedAt: {
      type: Date,
      default: null
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reLinksCount: {
      type: Number,
      default: 0,
      min: 0
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
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

// Compound indexes for optimal query performance
postSchema.index({ isDeleted: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ isDeleted: 1, level: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, department: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, category: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, tags: 1 });

/**
 * Format post for public feed delivery with safe author fields
 */
postSchema.methods.toSafePost = function (currentUserId = null) {
  const authorData = this.author && typeof this.author === 'object' && this.author.fullName
    ? {
        _id: this.author._id,
        fullName: this.author.fullName,
        level: this.author.level,
        department: this.author.department || null,
        verificationStatus: this.author.verificationStatus || 'unverified',
        role: this.author.role,
        avatar: this.author.avatar || ''
      }
    : this.author;

  const isAuthor = currentUserId && this.author && (
    (this.author._id && this.author._id.toString() === currentUserId.toString()) ||
    (this.author.toString() === currentUserId.toString())
  );

  return {
    _id: this._id,
    title: this.title,
    content: this.content,
    category: this.category,
    level: this.level,
    department: this.department,
    courseCode: this.courseCode,
    tags: this.tags || [],
    attachments: this.attachments || [],
    isPinned: this.isPinned,
    pinnedAt: this.pinnedAt,
    likesCount: this.likesCount,
    repliesCount: this.repliesCount,
    reLinksCount: this.reLinksCount,
    viewsCount: this.viewsCount,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: authorData,
    isAuthor: Boolean(isAuthor)
  };
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
