const mongoose = require('mongoose');
const {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  ELIGIBLE_LEVELS
} = require('@pharmalink/shared');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    category: {
      type: String,
      required: [true, 'Announcement category is required'],
      enum: {
        values: ANNOUNCEMENT_CATEGORIES,
        message: `Category must be one of: ${ANNOUNCEMENT_CATEGORIES.join(', ')}`
      },
      default: 'General'
    },
    priority: {
      type: String,
      enum: {
        values: ANNOUNCEMENT_PRIORITIES,
        message: `Priority must be one of: ${ANNOUNCEMENT_PRIORITIES.join(', ')}`
      },
      default: 'normal',
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    },
    targetLevels: {
      type: [String],
      default: ['All Levels']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    officialRole: {
      type: String,
      trim: true,
      default: 'PANS Executive'
    },
    attachments: [
      {
        fileName: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        fileSize: { type: Number, default: 0 }
      }
    ],
    viewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.index({ isPinned: -1, createdAt: -1 });
announcementSchema.index({ isPublished: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ category: 1, isPublished: 1 });
announcementSchema.index({ targetLevels: 1, isPublished: 1 });

announcementSchema.methods.toSafeAnnouncement = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
