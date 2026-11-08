const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  listStudentDirectory
} = require('../controllers/profileController');
const {
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  getFollowStatus
} = require('../controllers/followController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Active student's profile
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Student directory
router.get('/directory/students', requireAuth, listStudentDirectory);

// Social Following (EPIC-010)
router.post('/:id/follow', requireAuth, toggleFollowUser);
router.get('/:id/followers', requireAuth, getUserFollowers);
router.get('/:id/following', requireAuth, getUserFollowing);
router.get('/:id/follow-status', requireAuth, getFollowStatus);

// Public student profile
router.get('/:id', requireAuth, getUserProfile);

module.exports = router;
