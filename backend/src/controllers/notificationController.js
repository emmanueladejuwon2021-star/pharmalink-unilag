const Notification = require('../models/Notification');

/**
 * Internal helper to dispatch in-app notifications
 */
async function sendNotification({
  recipient,
  sender = null,
  type,
  message,
  post = null,
  material = null,
  announcement = null
}) {
  try {
    if (!recipient || (sender && recipient.toString() === sender.toString())) {
      return null;
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      message,
      post,
      material,
      announcement
    });

    return await notification.save();
  } catch (error) {
    console.error('Failed to dispatch notification:', error);
    return null;
  }
}

/**
 * Retrieve notifications for authenticated student
 * GET /api/notifications?page=1&limit=20
 */
async function getNotifications(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('sender', 'fullName matricNumber level department avatar verificationStatus role')
        .populate('post', 'content category')
        .populate('material', 'title courseCode')
        .populate('announcement', 'title category priority')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      notifications: notifications.map((n) => n.toSafeNotification())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fast endpoint for unread badge count
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark single notification as read
 * PATCH /api/notifications/:id/read
 */
async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      unreadCount,
      notification: notification.toSafeNotification()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendNotification,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
};
