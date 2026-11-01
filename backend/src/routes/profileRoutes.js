const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  listStudentDirectory
} = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Active student's profile
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Student directory
router.get('/directory/students', requireAuth, listStudentDirectory);

// Public student profile
router.get('/:id', requireAuth, getUserProfile);

module.exports = router;
