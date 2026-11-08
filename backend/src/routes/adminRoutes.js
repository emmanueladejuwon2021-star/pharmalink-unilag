const express = require('express');
const {
  getAdminMetrics,
  getVerificationQueue,
  approveVerification,
  rejectVerification,
  listUsers,
  updateUserRole,
  toggleUserSuspension
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Staff metrics & verification review accessible to Admin and Moderator
router.get('/metrics', requireAuth, requireRole('admin', 'moderator'), getAdminMetrics);
router.get('/verifications', requireAuth, requireRole('admin', 'moderator'), getVerificationQueue);
router.post('/verifications/:id/approve', requireAuth, requireRole('admin', 'moderator'), approveVerification);
router.post('/verifications/:id/reject', requireAuth, requireRole('admin', 'moderator'), rejectVerification);

// User account and role administration (Admin only)
router.get('/users', requireAuth, requireRole('admin', 'moderator'), listUsers);
router.patch('/users/:id/role', requireAuth, requireRole('admin'), updateUserRole);
router.patch('/users/:id/suspend', requireAuth, requireRole('admin'), toggleUserSuspension);

module.exports = router;
