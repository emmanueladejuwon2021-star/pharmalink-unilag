const express = require('express');
const {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  togglePinPost
} = require('../controllers/postController');
const {
  createComment,
  getComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
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

// Threaded Comments & Discussions (EPIC-008)
router.get('/:postId/comments', requireAuth, getComments);
router.post('/:postId/comments', requireAuth, createComment);
router.patch('/:postId/comments/:commentId', requireAuth, updateComment);
router.delete('/:postId/comments/:commentId', requireAuth, deleteComment);

module.exports = router;
