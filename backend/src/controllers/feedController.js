const mongoose = require('mongoose');
const Post = require('../models/Post');
const AcademicCourse = require('../models/AcademicCourse');
const {
  POST_TYPES,
  POST_VISIBILITIES,
  POST_LEVELS,
  isValidPostTitle,
  isValidPostBody,
  canPostAnnouncement,
  canViewPost
} = require('@pharmalink/shared');

/**
 * EPIC-006 / EPIC-007: Social Feed, Post Creation and Management.
 * Private-community boundary: only verified students may read or write
 * community content. Level-only posts hide from junior levels server-side.
 */

function toFeedJSON(post, viewer) {
  const obj = post.toObject();
  delete obj.__v;
  return {
    ...obj,
    // Computed on read so the client never has to trust stored flags
    viewerCanManage:
      !!viewer &&
      (String(post.author) === String(viewer._id) ||
        ['admin', 'moderator'].includes(viewer.role)),
    viewerCanPin: !!viewer && canPostAnnouncement(viewer.role)
  };
}

// GET /api/feed — the social feed for the signed-in verified student
async function listFeed(req, res, next) {
  try {
    const { tab, level, search, course } = req.query;

    const filter = { isDeleted: false };

    if (tab && tab !== 'all') {
      if (['discussions', 'questions', 'announcements'].includes(tab)) {
        const typeMap = { discussions: 'discussion', questions: 'question', announcements: 'announcement' };
        filter.type = typeMap[tab];
      } else if (tab === 'level') {
        if (!POST_LEVELS.includes(level)) {
          return res.status(400).json({
            success: false,
            message: 'Level filter must be one of: 200L, 300L, 400L, 500L'
          });
        }
        filter.authorLevel = level;
      } else {
        return res.status(400).json({ success: false, message: 'Unknown feed tab.' });
      }
    }

    if (course && typeof course === 'string' && course.trim()) {
      filter.courseCode = course.trim().toUpperCase();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: new RegExp(safeSearch, 'i') },
        { body: new RegExp(safeSearch, 'i') }
      ];
    }

    const posts = await Post.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(100);

    // Server-side visibility: drop level-only posts below the viewer's rank
    const visible = posts.filter((p) => canViewPost(req.user, p.toObject()));

    res.json({
      success: true,
      count: visible.length,
      posts: visible.map((p) => toFeedJSON(p, req.user))
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/feed/:id — single post detail
async function getPostById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post identifier.' });
    }
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    if (!canViewPost(req.user, post.toObject())) {
      return res.status(403).json({
        success: false,
        message: 'This post is restricted to its target level.'
      });
    }
    res.json({ success: true, post: toFeedJSON(post, req.user) });
  } catch (error) {
    next(error);
  }
}

// POST /api/feed — create a discussion/question (verified students) or an
// official announcement (PANS execs, level reps, moderators, admins)
async function createPost(req, res, next) {
  try {
    const { title, body, type, visibility, targetLevel, courseCode } = req.body || {};

    const postType = type || 'discussion';
    if (!POST_TYPES.includes(postType)) {
      return res.status(400).json({ success: false, message: 'Post type must be discussion, question or announcement.' });
    }

    if (postType === 'announcement' && !canPostAnnouncement(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only PANS executives, level representatives, moderators or admins can publish official announcements.'
      });
    }

    const titleCheck = isValidPostTitle(title);
    if (!titleCheck.valid) {
      return res.status(400).json({ success: false, message: titleCheck.message });
    }
    const bodyCheck = isValidPostBody(body);
    if (!bodyCheck.valid) {
      return res.status(400).json({ success: false, message: bodyCheck.message });
    }

    const vis = visibility || 'community';
    if (!POST_VISIBILITIES.includes(vis)) {
      return res.status(400).json({ success: false, message: 'Visibility must be community or level-only.' });
    }

    let level = targetLevel || 'all';
    if (!POST_LEVELS.includes(level)) {
      return res.status(400).json({ success: false, message: 'Target level must be all, 200L, 300L, 400L or 500L.' });
    }
    // Students posting level-only content can only address their own level
    if (vis === 'level-only' && req.user.role === 'student' && level !== req.user.level) {
      level = req.user.level;
    }

    let finalCourseCode;
    if (courseCode && String(courseCode).trim()) {
      finalCourseCode = String(courseCode).trim().toUpperCase();
      const exists = await AcademicCourse.exists({ code: finalCourseCode, isActive: true });
      if (!exists) {
        return res.status(400).json({
          success: false,
          message: `Course tag ${finalCourseCode} is not in the Faculty course catalogue.`
        });
      }
    }

    const post = await Post.create({
      author: req.user._id,
      authorName: req.user.fullName,
      authorLevel: req.user.level,
      authorRole: req.user.role,
      title: title.trim(),
      body: body.trim(),
      type: postType,
      visibility: vis,
      targetLevel: level,
      courseCode: finalCourseCode
    });

    res.status(201).json({
      success: true,
      message: 'Post published to the community feed.',
      post: toFeedJSON(post, req.user)
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/feed/:id — author edits their own post (content only)
async function updatePost(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post identifier.' });
    }
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts.' });
    }

    const { title, body } = req.body || {};
    if (title !== undefined) {
      const check = isValidPostTitle(title);
      if (!check.valid) return res.status(400).json({ success: false, message: check.message });
      post.title = title.trim();
    }
    if (body !== undefined) {
      const check = isValidPostBody(body);
      if (!check.valid) return res.status(400).json({ success: false, message: check.message });
      post.body = body.trim();
    }
    await post.save();

    res.json({
      success: true,
      message: 'Post updated.',
      post: toFeedJSON(post, req.user)
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/feed/:id — author removes their post; staff can moderate any post
async function deletePost(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post identifier.' });
    }
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    const isAuthor = String(post.author) === String(req.user._id);
    const isStaff = ['admin', 'moderator'].includes(req.user.role);
    if (!isAuthor && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove your own posts.'
      });
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.json({
      success: true,
      message: isStaff && !isAuthor ? 'Post removed by moderation.' : 'Post removed.'
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/feed/:id/pin — staff pins/unpins an announcement to the top of the feed
async function setPinned(req, res, next) {
  try {
    const { id } = req.params;
    const { pinned } = req.body || {};
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid post identifier.' });
    }
    if (!canPostAnnouncement(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only PANS executives, level representatives, moderators or admins can pin posts.'
      });
    }
    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    if (post.type !== 'announcement') {
      return res.status(400).json({
        success: false,
        message: 'Only official announcements can be pinned to the top of the feed.'
      });
    }

    post.isPinned = Boolean(pinned);
    post.pinnedAt = post.isPinned ? new Date() : null;
    await post.save();

    res.json({
      success: true,
      message: post.isPinned ? 'Announcement pinned.' : 'Announcement unpinned.',
      post: toFeedJSON(post, req.user)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFeed,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  setPinned,
  toFeedJSON
};
