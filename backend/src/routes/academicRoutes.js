const express = require('express');
const {
  getDepartments,
  getAcademicSessions,
  getCurrentAcademicSession,
  createAcademicSession,
  setCurrentAcademicSession,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/academicController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('@pharmalink/shared');

const router = express.Router();

// Faculty Departments & Academic Sessions
router.get('/departments', getDepartments);
router.get('/sessions', requireAuth, getAcademicSessions);
router.get('/sessions/current', getCurrentAcademicSession);

// Admin Session Management
router.post('/sessions', requireAuth, requireRole(USER_ROLES.ADMIN), createAcademicSession);
router.patch('/sessions/:id/set-current', requireAuth, requireRole(USER_ROLES.ADMIN), setCurrentAcademicSession);

// Courses
router.get('/courses', requireAuth, getCourses);
router.get('/courses/:id', requireAuth, getCourseById);

// Admin Course Management
router.post('/courses', requireAuth, requireRole(USER_ROLES.ADMIN), createCourse);
router.patch('/courses/:id', requireAuth, requireRole(USER_ROLES.ADMIN), updateCourse);
router.delete('/courses/:id', requireAuth, requireRole(USER_ROLES.ADMIN), deleteCourse);

module.exports = router;
