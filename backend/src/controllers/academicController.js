const AcademicCourse = require('../models/AcademicCourse');
const AcademicPeriod = require('../models/AcademicPeriod');
const User = require('../models/User');
const {
  ELIGIBLE_LEVELS,
  SEMESTERS,
  isValidAcademicSession,
  resolveCurrentAcademicPeriod,
  getNextLevel
} = require('@pharmalink/shared');

/**
 * EPIC-004: Academic Structure and Session Management
 * All handlers below validate input on the server and return consistent
 * JSON envelopes ({ success, message?, data? }).
 */

// GET /api/academic/current-period
function getCurrentPeriod(req, res) {
  const period = resolveCurrentAcademicPeriod(new Date());
  res.json({
    success: true,
    period: {
      session: period.session,
      semester: period.semester,
      sessions: buildRecentSessions(period.session)
    }
  });
}

// Helper: list of valid academic sessions around the current one
function buildRecentSessions(currentSession) {
  const startYear = parseInt(currentSession.split('/')[0], 10);
  const sessions = [];
  for (let y = startYear - 2; y <= startYear + 2; y++) {
    sessions.push(`${y}/${y + 1}`);
  }
  return sessions;
}

// GET /api/academic/courses?level=300L&session=... (public to authenticated users)
async function listCourses(req, res, next) {
  try {
    const { level, search } = req.query;

    const filter = { isActive: true };
    if (level) {
      if (!ELIGIBLE_LEVELS.includes(level)) {
        return res.status(400).json({
          success: false,
          message: 'Level filter must be one of: 200L, 300L, 400L, 500L'
        });
      }
      filter.level = level;
    }
    if (search && typeof search === 'string') {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { code: new RegExp(safeSearch, 'i') },
        { title: new RegExp(safeSearch, 'i') }
      ];
    }

    const courses = await AcademicCourse.find(filter)
      .sort('code')
      .limit(200);

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => c.toSafeObject())
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/academic/courses (admin/moderator only)
async function createCourse(req, res, next) {
  try {
    const { code, title, level, unit, semester, department } = req.body;

    if (!code || !title || !level) {
      return res.status(400).json({
        success: false,
        message: 'Course code, title and level are required'
      });
    }
    if (!ELIGIBLE_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      });
    }
    if (semester && !SEMESTERS.includes(semester)) {
      return res.status(400).json({
        success: false,
        message: `Semester must be one of: ${SEMESTERS.join(', ')}`
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const existing = await AcademicCourse.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Course ${normalizedCode} already exists in the catalogue`
      });
    }

    const course = await AcademicCourse.create({
      code: normalizedCode,
      title: String(title).trim(),
      level,
      unit,
      semester,
      department
    });

    res.status(201).json({ success: true, course: course.toSafeObject() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// PATCH /api/academic/courses/:id (admin/moderator only)
async function updateCourse(req, res, next) {
  try {
    const course = await AcademicCourse.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { title, level, unit, semester, department, isActive } = req.body;

    if (level !== undefined && !ELIGIBLE_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      });
    }
    if (semester !== undefined && semester !== null && !SEMESTERS.includes(semester)) {
      return res.status(400).json({
        success: false,
        message: `Semester must be one of: ${SEMESTERS.join(', ')}`
      });
    }

    if (title !== undefined) course.title = String(title).trim();
    if (level !== undefined) course.level = level;
    if (unit !== undefined) course.unit = unit;
    if (semester !== undefined) course.semester = semester;
    if (department !== undefined) course.department = String(department).trim();
    if (isActive !== undefined) course.isActive = Boolean(isActive);

    await course.save();
    res.json({ success: true, course: course.toSafeObject() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid course id' });
    }
    next(error);
  }
}

// GET /api/academic/my-period
async function getMyAcademicPeriod(req, res, next) {
  try {
    let period = await AcademicPeriod.findOne({ user: req.user._id });

    // Auto-initialise from the student's account + live calendar if missing
    if (!period) {
      const live = resolveCurrentAcademicPeriod(new Date());
      period = await AcademicPeriod.create({
        user: req.user._id,
        currentLevel: req.user.level,
        session: live.session,
        semester: live.semester
      });
    }

    res.json({ success: true, period: period.toSafeObject() });
  } catch (error) {
    next(error);
  }
}

// PUT /api/academic/my-period — student updates their own session/semester info
async function updateMyAcademicPeriod(req, res, next) {
  try {
    const { session, semester } = req.body;

    if (!session || !isValidAcademicSession(session)) {
      return res.status(400).json({
        success: false,
        message: 'Academic session must be a valid UNILAG AY string like 2025/2026'
      });
    }
    if (!semester || !SEMESTERS.includes(semester)) {
      return res.status(400).json({
        success: false,
        message: `Semester must be one of: ${SEMESTERS.join(', ')}`
      });
    }

    let period = await AcademicPeriod.findOne({ user: req.user._id });
    if (!period) {
      period = await AcademicPeriod.create({
        user: req.user._id,
        currentLevel: req.user.level,
        session,
        semester
      });
    } else {
      period.session = session;
      period.semester = semester;
      await period.save();
    }

    res.json({ success: true, period: period.toSafeObject() });
  } catch (error) {
    next(error);
  }
}

// POST /api/academic/admin/promote/:userId — staff advances a student one level
async function promoteStudent(req, res, next) {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }

    const nextLevel = getNextLevel(targetUser.level);
    if (!nextLevel) {
      return res.status(400).json({
        success: false,
        message: `${targetUser.level} is the final eligible level; the student cannot be promoted further.`
      });
    }

    const live = resolveCurrentAcademicPeriod(new Date());

    const period = await AcademicPeriod.findOneAndUpdate(
      { user: targetUser._id },
      {
        $set: { currentLevel: nextLevel, session: live.session, semester: live.semester },
        $push: {
          progressionHistory: {
            session: live.session,
            semester: live.semester,
            fromLevel: targetUser.level,
            toLevel: nextLevel,
            promotedBy: req.user._id,
            reason: String(req.body.reason || '').trim()
          }
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Keep the authoritative User record in sync with the promotion
    targetUser.level = nextLevel;
    await targetUser.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `${targetUser.fullName} promoted from ${period.progressionHistory.slice(-1)[0].fromLevel} to ${nextLevel}.`,
      period: period.toSafeObject(),
      student: targetUser.toSafeObject()
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }
    next(error);
  }
}

module.exports = {
  getCurrentPeriod,
  listCourses,
  createCourse,
  updateCourse,
  getMyAcademicPeriod,
  updateMyAcademicPeriod,
  promoteStudent
};
