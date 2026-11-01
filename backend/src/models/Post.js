const mongoose = require('mongoose');
const {
  POST_TYPES,
  POST_VISIBILITIES,
  POST_LEVELS,
  POST_TITLE_MAX_LENGTH,
  POST_BODY_MAX_LENGTH,
  isValidPostTitle,
  isValidPostBody
} = require('@pharmalink/shared');

/**
 * EPIC-006 / EPIC-007: Social Feed, Post Creation and Management.
 *
 * Community posts (discussions, questions) authored by verified students and
 * official announcements published by PANS executives, level reps, moderators
 * and admins. Content rules are shared with the frontend through
 * @pharmalink/shared so client and server always agree.
 */
const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Denormalised for fast feed rendering and level visibility checks
    authorName: { type: String, required: true },
    authorLevel: { type: String, required: true },
    authorRole: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [POST_TITLE_MAX_LENGTH, `Title must be ${POST_TITLE_MAX_LENGTH} characters or fewer`],
      validate: {
        validator: (value) => isValidPostTitle(value).valid,
        message: (props) => isValidPostTitle(props.value).message
      }
    },
    body: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [POST_BODY_MAX_LENGTH, `Content must be ${POST_BODY_MAX_LENGTH} characters or fewer`],
      validate: {
        validator: (value) => isValidPostBody(value).valid,
        message: (props) => isValidPostBody(props.value).message
      }
    },
    type: {
      type: String,
      enum: { values: POST_TYPES, message: 'Post type must be discussion, question or announcement' },
      default: 'discussion'
    },
    visibility: {
      type: String,
      enum: { values: POST_VISIBILITIES, message: 'Visibility must be community or level-only' },
      default: 'community'
    },
    targetLevel: {
      type: String,
      enum: { values: POST_LEVELS, message: 'Target level must be all, 200L, 300L, 400L or 500L' },
      default: 'all'
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2,4}\d{2,4}[A-Z]?$/, 'Course tag must look like PHR101 or PYC202'],
      default: undefined
    },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Feed queries: newest visible posts per type/level
postSchema.index({ isDeleted: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ author: 1, isDeleted: 1 });
postSchema.index({ type: 1, targetLevel: 1, isDeleted: 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
