const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  listProfiles,
  getProfileById
} = require('../controllers/profileController');
const { requireAuth, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();

// Own profile — any authenticated student (verified or not)
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Community directory & individual profiles — private boundary enforced:
// only verified members can browse other students' profiles.
router.get('/', requireAuth, requireVerified, listProfiles);
router.get('/:id', requireAuth, getProfileById);

module.exports = router;
