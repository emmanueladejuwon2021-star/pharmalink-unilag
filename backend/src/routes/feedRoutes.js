const express = require('express');
const {
  listFeed,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  setPinned
} = require('../controllers/feedController');
const { requireAuth, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();

// EPIC-006/007: The social feed lives behind the private-community boundary —
// authenticated AND verified UNILAG Pharmacy students only.
router.use(requireAuth, requireVerified);

router.get('/', listFeed);
router.post('/', createPost);
router.get('/:id', getPostById);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/pin', setPinned);

module.exports = router;
