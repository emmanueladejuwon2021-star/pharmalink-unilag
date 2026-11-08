const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getNotifications);
router.get('/unread-count', requireAuth, getUnreadCount);
router.patch('/:id/read', requireAuth, markNotificationRead);
router.post('/mark-all-read', requireAuth, markAllNotificationsRead);

module.exports = router;
