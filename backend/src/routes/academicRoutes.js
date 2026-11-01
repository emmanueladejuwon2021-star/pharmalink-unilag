const express = require('express');
const {
  getCurrentPeriod,
  listCourses,
  createCourse,
  updateCourse,
  getMyAcademicPeriod,
  updateMyAcademicPeriod,
  promoteStudent
} = require('../controllers/academicController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('@pharmalink/shared');

const router = express.Router();

// Academic calendar info (current session & semester)
router.get('/current-period', getCurrentPeriod);

// Course catalogue
router.get('/courses', requireAuth, listCourses);
router.post(
  '/courses',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR),
  createCourse
);
router.patch(
  '/courses/:id',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR),
  updateCourse
);

// Student academic period management
router.get('/my-period', requireAuth, getMyAcademicPeriod);
router.put('/my-period', requireAuth, updateMyAcademicPeriod);

// Staff promotion endpoint
router.post(
  '/admin/promote/:userId',
  requireAuth,
  requireRole(USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.PANS_EXEC),
  promoteStudent
);

module.exports = router;
