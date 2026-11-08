const express = require('express');
const {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  downloadMaterial,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materialController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// List materials and upload material
router.get('/', requireAuth, getMaterials);
router.post('/', requireAuth, uploadMaterial);

// Single material retrieval, update, and soft delete
router.get('/:id', requireAuth, getMaterialById);
router.patch('/:id', requireAuth, updateMaterial);
router.put('/:id', requireAuth, updateMaterial);
router.delete('/:id', requireAuth, deleteMaterial);

// Download tracking
router.get('/:id/download', requireAuth, downloadMaterial);
router.post('/:id/download', requireAuth, downloadMaterial);

module.exports = router;
