const User = require('../models/User');
const {
  ELIGIBLE_LEVELS,
  isValidDepartmentCode,
  isValidLevel
} = require('@pharmalink/shared');

/**
 * Get active student's full profile
 * GET /api/profile/me
 */
async function getMyProfile(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update active student's profile
 * PATCH /api/profile/me
 */
async function updateMyProfile(req, res, next) {
  try {
    const student = req.user;
    const { bio, department, avatar, interests, phone, socialLinks } = req.body;

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 300 characters.'
        });
      }
      student.bio = bio.trim();
    }

    if (department !== undefined) {
      if (department && !isValidDepartmentCode(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department code. Must be CPH, PCH, PCT, PCG, or PCL.'
        });
      }
      student.department = department ? department.trim().toUpperCase() : null;
    }

    if (avatar !== undefined) {
      student.avatar = typeof avatar === 'string' ? avatar.trim() : '';
    }

    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          message: 'Interests must be an array of topics or skills.'
        });
      }
      student.interests = interests
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 10)
        .map((item) => item.trim());
    }

    if (phone !== undefined) {
      student.phone = typeof phone === 'string' ? phone.trim() : '';
    }

    if (socialLinks && typeof socialLinks === 'object') {
      student.socialLinks = {
        linkedin: typeof socialLinks.linkedin === 'string' ? socialLinks.linkedin.trim() : student.socialLinks?.linkedin || '',
        twitter: typeof socialLinks.twitter === 'string' ? socialLinks.twitter.trim() : student.socialLinks?.twitter || '',
        github: typeof socialLinks.github === 'string' ? socialLinks.github.trim() : student.socialLinks?.github || ''
      };
    }

    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      user: student.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get public profile of another student
 * GET /api/profile/:id
 */
async function getUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      profile: user.toPublicProfile()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Student Directory (Browse faculty peers)
 * GET /api/profile/directory/students
 */
async function listStudentDirectory(req, res, next) {
  try {
    const { level, department, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (level && isValidLevel(level)) {
      query.level = level;
    }

    if (department && isValidDepartmentCode(department)) {
      query.department = department.toUpperCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { fullName: { $regex: term, $options: 'i' } },
        { matricNumber: { $regex: term, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(query)
        .sort({ level: 1, fullName: 1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    const publicProfiles = students.map((s) => s.toPublicProfile());

    return res.status(200).json({
      success: true,
      students: publicProfiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserProfile,
  listStudentDirectory
};
