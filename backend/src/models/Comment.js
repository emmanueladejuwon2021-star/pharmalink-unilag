const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
      index: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Parent post is required'],
      index: true
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    likesCount: {
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

commentSchema.index({ post: 1, isDeleted: 1, createdAt: 1 });

/**
 * Format comment for public delivery with safe author attributes
 */
commentSchema.methods.toSafeComment = function (currentUserId = null) {
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
    post: this.post,
    parentComment: this.parentComment,
    content: this.isDeleted ? '[This comment was deleted]' : this.content,
    likesCount: this.likesCount,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    isDeleted: this.isDeleted,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: this.isDeleted ? null : authorData,
    isAuthor: Boolean(isAuthor)
  };
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
