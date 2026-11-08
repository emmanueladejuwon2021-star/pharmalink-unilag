const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('@pharmalink/shared');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      default: null
    },
    announcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

notificationSchema.methods.toSafeNotification = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
