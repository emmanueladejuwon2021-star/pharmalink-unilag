const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follower user ID is required'],
      index: true
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Following target user ID is required'],
      index: true,
      validate: {
        validator: function (val) {
          if (!this.follower || !val) return true;
          return this.follower.toString() !== val.toString();
        },
        message: 'Students cannot follow themselves.'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a student cannot follow another student more than once
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Schema-level hook validation preventing self-follow
followSchema.pre('validate', function (next) {
  if (this.follower && this.following && this.follower.toString() === this.following.toString()) {
    return next(new Error('Students cannot follow themselves.'));
  }
  next();
});

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
