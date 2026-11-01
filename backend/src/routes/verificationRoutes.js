const express = require('express');
const {
  submitVerification,
  getVerificationStatus,
  listVerificationRequests,
  reviewVerificationRequest
} = require('../controllers/verificationController');
const { requireAuth, requireRole, requireVerified } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('@pharmalink/shared');

const router = express.Router();

// Student submission and status
router.post('/submit', requireAuth, submitVerification);
router.get('/status', requireAuth, getVerificationStatus);

// Gate check for verified students
router.get('/verified-only-gate', requireAuth, requireVerified, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to verified student lounge!'
  });
});

// Admin & Moderator management
router.get(
  '/requests',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.PANS_EXEC),
  listVerificationRequests
);

router.patch(
  '/requests/:id/review',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR),
  reviewVerificationRequest
);

module.exports = router;
