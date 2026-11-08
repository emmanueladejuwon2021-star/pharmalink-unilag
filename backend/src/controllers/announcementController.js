const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendNotification } = require('./notificationController');
const {
  isValidAnnouncementCategory,
  isValidAnnouncementPriority
} = require('@pharmalink/shared');

/**
 * Create Official PANS Announcement
 * POST /api/announcements
 * Restricted to PANS Executives, Level Reps, and Admins
 */
async function createAnnouncement(req, res, next) {
  try {
    const user = req.user;

    const allowedRoles = ['pans_exec', 'level_rep', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only PANS Executives, Level Representatives, and Admins can publish official announcements.'
      });
    }

    const {
      title,
      content,
      category = 'General',
      priority = 'normal',
      isPinned = false,
      targetLevels = ['All Levels'],
      officialRole,
      attachments = []
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title is required.'
      });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content is required.'
      });
    }

    if (!isValidAnnouncementCategory(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: General, Academic, Elections, Events, Dues & Welfare, Emergency`
      });
    }

    if (!isValidAnnouncementPriority(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be normal, urgent, or critical.`
      });
    }

    const roleName = officialRole || (user.role === 'pans_exec' ? 'PANS Executive' : user.role === 'level_rep' ? `${user.level} Representative` : 'Platform Administrator');

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      isPinned: !!isPinned,
      targetLevels: Array.isArray(targetLevels) ? targetLevels : [targetLevels],
      author: user._id,
      officialRole: roleName,
      attachments: Array.isArray(attachments) ? attachments : []
    });

    const saved = await announcement.save();
    const populated = await Announcement.findById(saved._id).populate('author', 'fullName level role avatar');

    // Asynchronously dispatch broadcast notifications to target students
    try {
      const studentQuery = { isSuspended: { $ne: true }, _id: { $ne: user._id } };
      if (!targetLevels.includes('All Levels') && targetLevels.length > 0) {
        studentQuery.level = { $in: targetLevels };
      }
      const students = await User.find(studentQuery).select('_id');
      for (const student of students) {
        await sendNotification({
          recipient: student._id,
          sender: user._id,
          type: 'announcement',
          message: `Official Notice: ${saved.title}`,
          announcement: saved._id
        });
      }
    } catch (notifErr) {
      console.error('Error dispatching announcement notifications:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Official announcement published successfully.',
      announcement: populated.toSafeAnnouncement()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve Announcements
 * GET /api/announcements?category=...&priority=...&level=...&pinned=...
 */
async function getAnnouncements(req, res, next) {
  try {
    const { category, priority, level, pinned } = req.query;

    const query = { isPublished: true };

    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (pinned !== undefined) query.isPinned = pinned === 'true';

    if (level) {
      query.targetLevels = { $in: ['All Levels', level] };
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'fullName level role avatar verificationStatus')
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements: announcements.map((a) => a.toSafeAnnouncement())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve single announcement details & increment views
 * GET /api/announcements/:id
 */
async function getAnnouncementById(req, res, next) {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('author', 'fullName level role avatar');

    if (!announcement || !announcement.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    return res.status(200).json({
      success: true,
      announcement: announcement.toSafeAnnouncement()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Pin or unpin an announcement
 * POST /api/announcements/:id/pin
 */
async function togglePinAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const allowedRoles = ['pans_exec', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only PANS Executives and Admins can pin announcements.'
      });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: announcement.isPinned ? 'Announcement pinned.' : 'Announcement unpinned.',
      isPinned: announcement.isPinned
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    if (announcement.author.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement.'
      });
    }

    announcement.isPublished = false;
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  togglePinAnnouncement,
  deleteAnnouncement
};
