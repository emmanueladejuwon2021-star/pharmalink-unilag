const express = require('express');
const { getUserBookmarks } = require('../controllers/engagementController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getUserBookmarks);

module.exports = router;
