const express = require('express');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  togglePinAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getAnnouncements);
router.post('/', requireAuth, requireRole('pans_exec', 'level_rep', 'admin'), createAnnouncement);
router.get('/:id', requireAuth, getAnnouncementById);
router.post('/:id/pin', requireAuth, requireRole('pans_exec', 'admin'), togglePinAnnouncement);
router.delete('/:id', requireAuth, deleteAnnouncement);

module.exports = router;
