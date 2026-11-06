const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

/**
 * Add a comment or reply to a post
 * POST /api/posts/:postId/comments
 */
async function createComment(req, res, next) {
  try {
    const { postId } = req.params;
    const user = req.user;

    // Strict boundary: verified UNILAG students only can participate in discussions
    if (user.verificationStatus !== 'verified' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Student verification required to comment on discussions.'
      });
    }

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Parent post not found.'
      });
    }

    const { content, parentCommentId } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters.'
      });
    }

    let parentComment = null;
    if (parentCommentId) {
      const parent = await Comment.findOne({ _id: parentCommentId, post: postId, isDeleted: false });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found.'
        });
      }
      parentComment = parent._id;
    }

    const comment = new Comment({
      author: user._id,
      post: postId,
      parentComment,
      content: content.trim()
    });

    await comment.save();

    // Increment replies count on post (atomic)
    await Post.findByIdAndUpdate(postId, {
      $inc: { repliesCount: 1 }
    });

    // Reward author with 2 discussion reputation points
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'stats.reputationPoints': 2 }
    });

    await comment.populate('author', 'fullName level department verificationStatus role avatar');

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment: comment.toSafeComment(user._id)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve threaded comments for a post
 * GET /api/posts/:postId/comments
 */
async function getComments(req, res, next) {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    // Include soft-deleted comments so the thread structure is preserved;
    // toSafeComment will render them as placeholders.
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'fullName level department verificationStatus role avatar');

    const currentUserId = req.user ? req.user._id : null;
    const safeComments = comments.map((c) => c.toSafeComment(currentUserId));

    return res.status(200).json({
      success: true,
      comments: safeComments,
      count: safeComments.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Edit an existing comment
 * PATCH /api/posts/:postId/comments/:commentId
 */
async function updateComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const user = req.user;

    const comment = await Comment.findOne({ _id: commentId, post: postId, isDeleted: false });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    const isAuthor = comment.author.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this comment.'
      });
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters.'
      });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate('author', 'fullName level department verificationStatus role avatar');

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment: comment.toSafeComment(user._id)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft delete a comment
 * DELETE /api/posts/:postId/comments/:commentId
 */
async function deleteComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const user = req.user;

    const comment = await Comment.findOne({ _id: commentId, post: postId });
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    const isAuthor = comment.author.toString() === user._id.toString();
    const isStaff = ['admin', 'moderator'].includes(user.role);

    if (!isAuthor && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment.'
      });
    }

    comment.isDeleted = true;
    await comment.save();

    // Safe decrement of post replies count (only if positive)
    await Post.findOneAndUpdate(
      { _id: postId, repliesCount: { $gt: 0 } },
      { $inc: { repliesCount: -1 } }
    );

    // Reverse the +2 reputation awarded on comment creation (only if sufficient)
    await User.findOneAndUpdate(
      { _id: comment.author, 'stats.reputationPoints': { $gte: 2 } },
      { $inc: { 'stats.reputationPoints': -2 } }
    );

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment
};
