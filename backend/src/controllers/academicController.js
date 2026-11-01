const AcademicSession = require('../models/AcademicSession');
const Course = require('../models/Course');
const {
  DEPARTMENTS,
  SEMESTERS,
  ELIGIBLE_LEVELS,
  isValidCourseCode,
  isValidAcademicSession,
  isValidDepartmentCode,
  isValidSemester,
  isValidLevel
} = require('@pharmalink/shared');

/**
 * List all UNILAG Faculty of Pharmacy Departments
 * GET /api/academic/departments
 */
async function getDepartments(req, res, next) {
  try {
    // Count active courses per department
    const courseCounts = await Course.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    courseCounts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const enrichedDepartments = DEPARTMENTS.map((dept) => ({
      ...dept,
      courseCount: countMap[dept.code] || 0
    }));

    return res.status(200).json({
      success: true,
      departments: enrichedDepartments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Academic Sessions
 * GET /api/academic/sessions
 */
async function getAcademicSessions(req, res, next) {
  try {
    const sessions = await AcademicSession.find().sort({ name: -1 });
    return res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Current Active Academic Session & Semester
 * GET /api/academic/sessions/current
 */
async function getCurrentAcademicSession(req, res, next) {
  try {
    let currentSession = await AcademicSession.findOne({ isCurrent: true });

    if (!currentSession) {
      // Fallback to most recent session or default
      currentSession = await AcademicSession.findOne().sort({ name: -1 });
    }

    return res.status(200).json({
      success: true,
      session: currentSession || {
        name: '2024/2025',
        currentSemester: 'First Semester',
        isCurrent: true
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create an Academic Session (Admin)
 * POST /api/academic/sessions
 */
async function createAcademicSession(req, res, next) {
  try {
    const { name, currentSemester = 'First Semester', isCurrent = false, startDate, endDate } = req.body;

    if (!name || !isValidAcademicSession(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session format. Must be YYYY/YYYY (e.g., 2024/2025).'
      });
    }

    if (!isValidSemester(currentSemester)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester. Must be First Semester or Second Semester.'
      });
    }

    const existing = await AcademicSession.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Academic session ${name} already exists.`
      });
    }

    const session = new AcademicSession({
      name: name.trim(),
      currentSemester,
      isCurrent: Boolean(isCurrent),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: req.user._id
    });

    await session.save();

    return res.status(201).json({
      success: true,
      message: `Academic session ${session.name} created successfully.`,
      session
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Set an Academic Session as Current (Admin)
 * PATCH /api/academic/sessions/:id/set-current
 */
async function setCurrentAcademicSession(req, res, next) {
  try {
    const { id } = req.params;
    const { currentSemester } = req.body;

    const session = await AcademicSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Academic session not found.'
      });
    }

    session.isCurrent = true;
    if (currentSemester && isValidSemester(currentSemester)) {
      session.currentSemester = currentSemester;
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: `Academic session ${session.name} is now the active current session.`,
      session
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Courses with Filters (Level, Department, Semester, Search)
 * GET /api/academic/courses
 */
async function getCourses(req, res, next) {
  try {
    const { level, department, semester, search, activeOnly = 'true' } = req.query;

    const query = {};

    if (activeOnly === 'true') {
      query.isActive = true;
    }

    if (level && isValidLevel(level)) {
      query.level = level;
    }

    if (department && isValidDepartmentCode(department)) {
      query.department = department.toUpperCase();
    }

    if (semester && isValidSemester(semester)) {
      query.semester = semester;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { code: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .sort({ level: 1, department: 1, code: 1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Course by ID
 * GET /api/academic/courses/:id
 */
async function getCourseById(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    const deptInfo = DEPARTMENTS.find((d) => d.code === course.department);

    return res.status(200).json({
      success: true,
      course: {
        ...course.toObject(),
        departmentName: deptInfo ? deptInfo.name : course.department
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new Course (Admin)
 * POST /api/academic/courses
 */
async function createCourse(req, res, next) {
  try {
    const { code, title, department, level, semester, units, description } = req.body;

    if (!code || !isValidCourseCode(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course code format. Must be 3 letters, space, 3 digits (e.g. PCH 301).'
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Course title must be at least 3 characters long.'
      });
    }

    if (!department || !isValidDepartmentCode(department)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department code. Must be one of CPH, PCH, PCT, PCG, PCL.'
      });
    }

    if (!level || !isValidLevel(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic level. Must be 200L, 300L, 400L, or 500L.'
      });
    }

    if (!semester || !isValidSemester(semester)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester. Must be First Semester or Second Semester.'
      });
    }

    const unitsNum = parseInt(units, 10);
    if (isNaN(unitsNum) || unitsNum < 1 || unitsNum > 6) {
      return res.status(400).json({
        success: false,
        message: 'Course units must be a number between 1 and 6.'
      });
    }

    // Check duplicate code
    const existing = await Course.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Course with code ${code.toUpperCase()} already exists.`
      });
    }

    const course = await Course.create({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      department: department.trim().toUpperCase(),
      level,
      semester,
      units: unitsNum,
      description: description ? description.trim() : '',
      isActive: true,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: `Course ${course.code}: ${course.title} registered successfully.`,
      course
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Course (Admin)
 * PATCH /api/academic/courses/:id
 */
async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { title, units, description, semester, isActive } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    if (title && title.trim().length >= 3) {
      course.title = title.trim();
    }

    if (units) {
      const unitsNum = parseInt(units, 10);
      if (!isNaN(unitsNum) && unitsNum >= 1 && unitsNum <= 6) {
        course.units = unitsNum;
      }
    }

    if (description !== undefined) {
      course.description = description.trim();
    }

    if (semester && isValidSemester(semester)) {
      course.semester = semester;
    }

    if (isActive !== undefined) {
      course.isActive = Boolean(isActive);
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: `Course ${course.code} updated successfully.`,
      course
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deactivate / Delete Course (Admin)
 * DELETE /api/academic/courses/:id
 */
async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.'
      });
    }

    await Course.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Course ${course.code} has been deleted.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
