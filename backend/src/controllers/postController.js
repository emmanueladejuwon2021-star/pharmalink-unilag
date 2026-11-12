const Post = require('../models/Post');
const User = require('../models/User');
const Like = require('../models/Like');
const ReLink = require('../models/ReLink');
const Bookmark = require('../models/Bookmark');
const {
  POST_CATEGORIES,
  POST_AUDIENCE_LEVELS,
  isValidPostCategory,
  isValidPostTargetLevel,
  isValidDepartmentCode,
  isValidCourseCode
} = require('@pharmalink/shared');

/**
 * Extract hashtag strings from post text (e.g., "#medicinalchem #pharmacy")
 */
function extractHashtags(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

/**
 * Create a new academic or social discussion post
 * POST /api/posts
 */
async function createPost(req, res, next) {
  try {
    const user = req.user;

    // Strict boundary: verified UNILAG students only can publish
    if (user.verificationStatus !== 'verified' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Student verification required. Please submit your UNILAG ID to publish posts to the faculty network.'
      });
    }

    const {
      title,
      content,
      category,
      level,
      department,
      courseCode,
      tags,
      isPinned
    } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required and must be at least 3 characters long.'
      });
    }

    if (content.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 3000 characters.'
      });
    }

    let postCategory = 'Academic Discussion';
    if (category) {
      if (!isValidPostCategory(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${POST_CATEGORIES.join(', ')}`
        });
      }
      postCategory = category;
    }

    let targetLevel = 'All Levels';
    if (level) {
      if (!isValidPostTargetLevel(level)) {
        return res.status(400).json({
          success: false,
          message: `Invalid target level. Must be one of: ${POST_AUDIENCE_LEVELS.join(', ')}`
        });
      }
      targetLevel = level;
    }

    let targetDept = null;
    if (department) {
      if (!isValidDepartmentCode(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department code. Must be CPH, PCH, PCT, PCG, or PCL.'
        });
      }
      targetDept = department.trim().toUpperCase();
    }

    let parsedCourse = null;
    if (courseCode && courseCode.trim()) {
      if (!isValidCourseCode(courseCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course code format. Expected format like "PCH 301" or "CPH 402".'
        });
      }
      parsedCourse = courseCode.trim().toUpperCase();
    }

    // Merge explicitly passed tags with inline hashtags from content
    const inlineTags = extractHashtags(content);
    const explicitTags = Array.isArray(tags)
      ? tags.map((t) => (typeof t === 'string' ? t.replace(/^#/, '').trim().toLowerCase() : '')).filter(Boolean)
      : [];
    const combinedTags = Array.from(new Set([...explicitTags, ...inlineTags])).slice(0, 8);

    // Pinning capability restricted to authorized roles
    const canPin = ['admin', 'moderator', 'pans_exec'].includes(user.role);
    const pinRequested = Boolean(isPinned && canPin);

    const newPost = new Post({
      author: user._id,
      title: title && typeof title === 'string' ? title.trim() : '',
      content: content.trim(),
      category: postCategory,
      level: targetLevel,
      department: targetDept,
      courseCode: parsedCourse,
      tags: combinedTags,
      isPinned: pinRequested,
      pinnedAt: pinRequested ? new Date() : null,
      pinnedBy: pinRequested ? user._id : null
    });

    await newPost.save();

    // Increment author stats and reputation points
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        'stats.postsCount': 1,
        'stats.reputationPoints': 5
      }
    });

    // Populate author details for immediate client rendering
    await newPost.populate('author', 'fullName level department verificationStatus role avatar matricNumber');

    return res.status(201).json({
      success: true,
      message: 'Post published successfully to BD-Pharm network.',
      post: newPost.toSafePost(user._id)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve public social feed with filtering, pagination, and sorting
 * GET /api/posts
 */
async function getFeed(req, res, next) {
  try {
    const {
      level,
      department,
      category,
      courseCode,
      tag,
      search,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isDeleted: false };
    const andConditions = [];

    // Target academic level filter
    if (level && level !== 'all' && level !== 'All Levels') {
      andConditions.push({
        $or: [{ level: level }, { level: 'All Levels' }]
      });
    }

    // Department filter
    if (department && department !== 'all') {
      const deptUpper = department.toUpperCase();
      if (isValidDepartmentCode(deptUpper)) {
        query.department = deptUpper;
      }
    }

    // Category filter
    if (category && category !== 'All') {
      if (isValidPostCategory(category)) {
        query.category = category;
      }
    }

    // Course code filter
    if (courseCode && courseCode.trim()) {
      query.courseCode = courseCode.trim().toUpperCase();
    }

    // Hashtag filter
    if (tag && tag.trim()) {
      const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
      query.tags = cleanTag;
    }

    // Keyword search in content or title
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [{ content: regex }, { title: regex }, { courseCode: regex }]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Sort order: pinned posts always at top
    const sortConfig = sort === 'popular'
      ? { isPinned: -1, likesCount: -1, repliesCount: -1, createdAt: -1 }
      : { isPinned: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'fullName level department verificationStatus role avatar matricNumber'),
      Post.countDocuments(query)
    ]);

    const currentUserId = req.user ? req.user._id : null;
    let likedPostIds = new Set();
    let relinkedPostIds = new Set();
    let bookmarkedPostIds = new Set();

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const [likes, relinks, bookmarks] = await Promise.all([
        Like.find({ user: currentUserId, targetType: 'Post', targetId: { $in: postIds } }).select('targetId'),
        ReLink.find({ user: currentUserId, post: { $in: postIds } }).select('post'),
        Bookmark.find({ user: currentUserId, post: { $in: postIds } }).select('post')
      ]);

      likedPostIds = new Set(likes.map((l) => l.targetId.toString()));
      relinkedPostIds = new Set(relinks.map((r) => r.post.toString()));
      bookmarkedPostIds = new Set(bookmarks.map((b) => b.post.toString()));
    }

    const safePosts = posts.map((p) => {
      const safe = p.toSafePost(currentUserId);
      safe.hasLiked = likedPostIds.has(p._id.toString());
      safe.hasReLinked = relinkedPostIds.has(p._id.toString());
      safe.hasBookmarked = bookmarkedPostIds.has(p._id.toString());
      return safe;
    });

    return res.status(200).json({
      success: true,
      posts: safePosts,
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

/**
 * Retrieve single post details by ID
 * GET /api/posts/:id
 */
async function getPostById(req, res, next) {
  try {
    const { id } = req.params;

    const post = await Post.findOne({ _id: id, isDeleted: false })
      .populate('author', 'fullName level department verificationStatus role avatar matricNumber');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    // Increment view count asynchronously
    Post.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } }).exec();

    const currentUserId = req.user ? req.user._id : null;
    const safePost = post.toSafePost(currentUserId);

    if (currentUserId) {
      const [like, relink, bookmark] = await Promise.all([
        Like.findOne({ user: currentUserId, targetType: 'Post', targetId: id }),
        ReLink.findOne({ user: currentUserId, post: id }),
        Bookmark.findOne({ user: currentUserId, post: id })
      ]);
      safePost.hasLiked = Boolean(like);
      safePost.hasReLinked = Boolean(relink);
      safePost.hasBookmarked = Boolean(bookmark);
    } else {
      safePost.hasLiked = false;
      safePost.hasReLinked = false;
      safePost.hasBookmarked = false;
    }

    return res.status(200).json({
      success: true,
      post: safePost
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing post
 * PATCH /api/posts/:id
 */
async function updatePost(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const isAuthor = post.author.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this post.'
      });
    }

    const { title, content, category, level, department, courseCode, tags } = req.body;

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Post content must be at least 3 characters.'
        });
      }
      if (content.trim().length > 3000) {
        return res.status(400).json({
          success: false,
          message: 'Post content cannot exceed 3000 characters.'
        });
      }
      post.content = content.trim();
    }

    if (title !== undefined) {
      post.title = typeof title === 'string' ? title.trim() : '';
    }

    if (category !== undefined) {
      if (!isValidPostCategory(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid post category.'
        });
      }
      post.category = category;
    }

    if (level !== undefined) {
      if (!isValidPostTargetLevel(level)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target level.'
        });
      }
      post.level = level;
    }

    if (department !== undefined) {
      if (department && !isValidDepartmentCode(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department code.'
        });
      }
      post.department = department ? department.trim().toUpperCase() : null;
    }

    if (courseCode !== undefined) {
      if (courseCode && !isValidCourseCode(courseCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course code format.'
        });
      }
      post.courseCode = courseCode ? courseCode.trim().toUpperCase() : null;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      post.tags = Array.from(new Set(tags.map((t) => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean)));
    }

    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();
    await post.populate('author', 'fullName level department verificationStatus role avatar matricNumber');

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      post: post.toSafePost(user._id)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a post (soft delete)
 * DELETE /api/posts/:id
 */
async function deletePost(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const isAuthor = post.author.toString() === user._id.toString();
    const isStaff = ['admin', 'moderator'].includes(user.role);

    if (!isAuthor && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post.'
      });
    }

    post.isDeleted = true;
    await post.save();

    // Decrement author post count only if currently > 0 (schema min does not protect $inc)
    await User.updateOne(
      { _id: post.author, 'stats.postsCount': { $gt: 0 } },
      { $inc: { 'stats.postsCount': -1 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle pin status for a post
 * POST /api/posts/:id/pin
 */
async function togglePinPost(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const canPin = ['admin', 'moderator', 'pans_exec'].includes(user.role);
    if (!canPin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators, moderators, and PANS executives can pin announcements.'
      });
    }

    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    post.isPinned = !post.isPinned;
    post.pinnedAt = post.isPinned ? new Date() : null;
    post.pinnedBy = post.isPinned ? user._id : null;

    await post.save();
    await post.populate('author', 'fullName level department verificationStatus role avatar matricNumber');

    return res.status(200).json({
      success: true,
      message: post.isPinned ? 'Post pinned to top of feed.' : 'Post unpinned.',
      post: post.toSafePost(user._id)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  togglePinPost
};
