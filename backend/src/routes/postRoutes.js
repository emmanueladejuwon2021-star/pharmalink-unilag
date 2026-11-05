const express = require('express');
const {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  togglePinPost
} = require('../controllers/postController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Social feed and post creation (authenticated pharmacy students)
router.get('/', requireAuth, getFeed);
router.post('/', requireAuth, createPost);

// Single post operations
router.get('/:id', requireAuth, getPostById);
router.patch('/:id', requireAuth, updatePost);
router.delete('/:id', requireAuth, deletePost);

// Pin / Unpin post
router.post('/:id/pin', requireAuth, togglePinPost);

module.exports = router;
