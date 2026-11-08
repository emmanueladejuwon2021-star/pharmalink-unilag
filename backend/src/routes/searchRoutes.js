const express = require('express');
const { globalSearch } = require('../controllers/searchController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Search is accessible to all authenticated pharmacy students
router.get('/', requireAuth, globalSearch);

module.exports = router;
