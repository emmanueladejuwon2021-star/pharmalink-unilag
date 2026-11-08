const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: ['Post', 'Comment'],
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate likes from the same user on the same target
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
