const express = require('express');
const {
  createReport,
  getReports,
  resolveReport
} = require('../controllers/reportController');
const { requireAuth, requireRole, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();

// Only verified pharmacy students (200L-500L) can submit a report
router.post('/', requireAuth, requireVerified, createReport);

// Only Admins and Moderators can view and resolve reports
router.get('/', requireAuth, requireRole('admin', 'moderator'), getReports);
router.patch('/:id/resolve', requireAuth, requireRole('admin', 'moderator'), resolveReport);

module.exports = router;
