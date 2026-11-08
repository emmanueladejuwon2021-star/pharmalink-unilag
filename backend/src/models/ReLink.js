const mongoose = require('mongoose');

const reLinkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate re-links by the same user on the same post
reLinkSchema.index({ user: 1, post: 1 }, { unique: true });

const ReLink = mongoose.model('ReLink', reLinkSchema);

module.exports = ReLink;
