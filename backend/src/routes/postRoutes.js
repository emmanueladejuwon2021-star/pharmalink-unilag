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
const {
  toggleLikePost,
  toggleLikeComment,
  toggleReLinkPost,
  toggleBookmark
} = require('../controllers/engagementController');
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

// Engagement: Likes, Re-Links, and Bookmarks (EPIC-009)
router.post('/:id/like', requireAuth, toggleLikePost);
router.post('/:id/relink', requireAuth, toggleReLinkPost);
router.post('/:id/bookmark', requireAuth, toggleBookmark);

// Threaded Comments & Discussions (EPIC-008)
router.get('/:postId/comments', requireAuth, getComments);
router.post('/:postId/comments', requireAuth, createComment);
router.patch('/:postId/comments/:commentId', requireAuth, updateComment);
router.delete('/:postId/comments/:commentId', requireAuth, deleteComment);

// Comment Engagement (EPIC-009)
router.post('/:postId/comments/:commentId/like', requireAuth, toggleLikeComment);

module.exports = router;
