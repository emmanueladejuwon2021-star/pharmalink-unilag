const express = require('express');
const {
  submitVerification,
  getMyVerificationStatus,
  getPendingRequests,
  reviewVerificationRequest
} = require('../controllers/verificationController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('@pharmalink/shared');

const router = express.Router();

// Student endpoints
router.post('/submit', requireAuth, submitVerification);
router.get('/status', requireAuth, getMyVerificationStatus);

// Staff / Moderator / Admin endpoints
router.get(
  '/admin/requests',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.PANS_EXEC),
  getPendingRequests
);

router.post(
  '/admin/review/:id',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.PANS_EXEC),
  reviewVerificationRequest
);

module.exports = router;
