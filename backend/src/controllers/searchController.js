const Post = require('../models/Post');
const Material = require('../models/Material');
const User = require('../models/User');

/**
 * Global Search across Posts, Materials Vault, and Pharmacy Students
 * GET /api/search?q=...&type=all|posts|materials|students&level=...&department=...
 */
async function globalSearch(req, res, next) {
  try {
    const {
      q = '',
      type = 'all',
      level,
      department,
      limit = 10
    } = req.query;

    const trimmed = q.trim();
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    if (!trimmed) {
      return res.status(200).json({
        success: true,
        query: '',
        counts: { total: 0, posts: 0, materials: 0, students: 0 },
        results: { posts: [], materials: [], students: [] }
      });
    }

    const safeRegex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const results = {
      posts: [],
      materials: [],
      students: []
    };

    // 1. Search Posts
    if (type === 'all' || type === 'posts') {
      const postFilter = {
        isDeleted: { $ne: true },
        $or: [
          { content: safeRegex },
          { tags: safeRegex },
          { category: safeRegex }
        ]
      };

      if (level) {
        postFilter.targetLevel = { $in: [level, 'All Levels'] };
      }

      results.posts = await Post.find(postFilter)
        .populate('author', 'fullName matricNumber level department avatar verificationStatus role')
        .sort({ createdAt: -1 })
        .limit(parsedLimit);
    }

    // 2. Search Materials Vault
    if (type === 'all' || type === 'materials') {
      const materialFilter = {
        isDeleted: { $ne: true },
        $or: [
          { title: safeRegex },
          { description: safeRegex },
          { courseCode: safeRegex },
          { materialType: safeRegex }
        ]
      };

      if (level) materialFilter.level = level;
      if (department) materialFilter.department = department.toUpperCase();

      results.materials = await Material.find(materialFilter)
        .populate('uploader', 'fullName level department avatar verificationStatus')
        .sort({ downloadsCount: -1, viewsCount: -1, createdAt: -1 })
        .limit(parsedLimit);
    }

    // 3. Search Pharmacy Students Directory
    if (type === 'all' || type === 'students') {
      const studentFilter = {
        isSuspended: { $ne: true },
        $or: [
          { fullName: safeRegex },
          { matricNumber: safeRegex }
        ]
      };

      if (level) studentFilter.level = level;
      if (department) studentFilter.department = department.toUpperCase();

      const matchedStudents = await User.find(studentFilter)
        .sort({ 'stats.reputationPoints': -1, fullName: 1 })
        .limit(parsedLimit);

      results.students = matchedStudents.map((u) => u.toPublicProfile());
    }

    const counts = {
      posts: results.posts.length,
      materials: results.materials.length,
      students: results.students.length,
      total: results.posts.length + results.materials.length + results.students.length
    };

    return res.status(200).json({
      success: true,
      query: trimmed,
      counts,
      results
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  globalSearch
};
