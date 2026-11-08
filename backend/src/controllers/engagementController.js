const Like = require('../models/Like');
const ReLink = require('../models/ReLink');
const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

/**
 * Toggle like on a post
 * POST /api/posts/:id/like
 */
async function toggleLikePost(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    // Strict boundary: verified students only can engage with likes
    if (user.verificationStatus !== 'verified' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Student verification required to like posts.'
      });
    }

    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const existingLike = await Like.findOne({
      user: user._id,
      targetType: 'Post',
      targetId: id
    });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { $inc: { likesCount: -1 } },
        { new: true }
      );

      // Decrement author reputation points
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.reputationPoints': -1 }
      });

      return res.status(200).json({
        success: true,
        liked: false,
        likesCount: Math.max(0, updatedPost.likesCount),
        message: 'Post unliked.'
      });
    } else {
      // Like
      await Like.create({
        user: user._id,
        targetType: 'Post',
        targetId: id
      });
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { $inc: { likesCount: 1 } },
        { new: true }
      );

      // Award author +1 reputation point
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.reputationPoints': 1 }
      });

      return res.status(200).json({
        success: true,
        liked: true,
        likesCount: updatedPost.likesCount,
        message: 'Post liked.'
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle like on a comment
 * POST /api/posts/:postId/comments/:commentId/like
 */
async function toggleLikeComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const user = req.user;

    if (user.verificationStatus !== 'verified' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Student verification required to like comments.'
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      post: postId,
      isDeleted: false
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    const existingLike = await Like.findOne({
      user: user._id,
      targetType: 'Comment',
      targetId: commentId
    });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likesCount: -1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(comment.author, {
        $inc: { 'stats.reputationPoints': -1 }
      });

      return res.status(200).json({
        success: true,
        liked: false,
        likesCount: Math.max(0, updatedComment.likesCount),
        message: 'Comment unliked.'
      });
    } else {
      await Like.create({
        user: user._id,
        targetType: 'Comment',
        targetId: commentId
      });
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likesCount: 1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(comment.author, {
        $inc: { 'stats.reputationPoints': 1 }
      });

      return res.status(200).json({
        success: true,
        liked: true,
        likesCount: updatedComment.likesCount,
        message: 'Comment liked.'
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle Re-Link (share) on a post
 * POST /api/posts/:id/relink
 */
async function toggleReLinkPost(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.verificationStatus !== 'verified' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Student verification required to re-link posts.'
      });
    }

    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const existingReLink = await ReLink.findOne({
      user: user._id,
      post: id
    });

    if (existingReLink) {
      await ReLink.deleteOne({ _id: existingReLink._id });
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { $inc: { reLinksCount: -1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.reputationPoints': -1 }
      });

      return res.status(200).json({
        success: true,
        relinked: false,
        reLinksCount: Math.max(0, updatedPost.reLinksCount),
        message: 'Post removed from your re-links.'
      });
    } else {
      await ReLink.create({
        user: user._id,
        post: id
      });
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        { $inc: { reLinksCount: 1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.reputationPoints': 1 }
      });

      return res.status(200).json({
        success: true,
        relinked: true,
        reLinksCount: updatedPost.reLinksCount,
        message: 'Post re-linked to your network!'
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle bookmark on a post
 * POST /api/posts/:id/bookmark
 */
async function toggleBookmark(req, res, next) {
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

    const existingBookmark = await Bookmark.findOne({
      user: user._id,
      post: id
    });

    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return res.status(200).json({
        success: true,
        bookmarked: false,
        message: 'Post removed from your bookmarks.'
      });
    } else {
      await Bookmark.create({
        user: user._id,
        post: id
      });
      return res.status(200).json({
        success: true,
        bookmarked: true,
        message: 'Post saved to your bookmarks.'
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user's saved bookmarks
 * GET /api/bookmarks
 */
async function getUserBookmarks(req, res, next) {
  try {
    const user = req.user;

    const bookmarks = await Bookmark.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'fullName level department verificationStatus role avatar'
        }
      });

    // Filter out bookmarks whose post has been deleted
    const validBookmarks = bookmarks
      .filter((b) => b.post && !b.post.isDeleted)
      .map((b) => ({
        _id: b._id,
        createdAt: b.createdAt,
        post: b.post.toSafePost ? b.post.toSafePost(user._id) : b.post
      }));

    return res.status(200).json({
      success: true,
      bookmarks: validBookmarks,
      count: validBookmarks.length
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  toggleLikePost,
  toggleLikeComment,
  toggleReLinkPost,
  toggleBookmark,
  getUserBookmarks
};
