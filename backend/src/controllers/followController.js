const mongoose = require('mongoose');
const User = require('../models/User');
const Follow = require('../models/Follow');

/**
 * Toggle follow/unfollow on a student peer
 * POST /api/profile/:id/follow
 */
async function toggleFollowUser(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    // Strict boundary: verified students (or admins/moderators) only can follow peers
    if (user.verificationStatus !== 'verified' && user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to verified UNILAG Pharmacy students.'
      });
    }

    // Prevent self-follow
    if (user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Students cannot follow themselves.'
      });
    }

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.'
      });
    }

    // Target user check
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const existingFollow = await Follow.findOne({
      follower: user._id,
      following: targetUser._id
    });

    if (existingFollow) {
      // Unfollow peer
      await Follow.deleteOne({ _id: existingFollow._id });

      // Atomic decrements on both users
      await Promise.all([
        User.findByIdAndUpdate(user._id, { $inc: { 'stats.followingCount': -1 } }),
        User.findByIdAndUpdate(targetUser._id, { $inc: { 'stats.followersCount': -1 } })
      ]);

      // Guard against counters dropping below 0
      await Promise.all([
        User.updateOne({ _id: user._id, 'stats.followingCount': { $lt: 0 } }, { $set: { 'stats.followingCount': 0 } }),
        User.updateOne({ _id: targetUser._id, 'stats.followersCount': { $lt: 0 } }, { $set: { 'stats.followersCount': 0 } })
      ]);

      return res.status(200).json({
        success: true,
        isFollowing: false,
        message: 'Unfollowed student.'
      });
    } else {
      // Follow peer
      await Follow.create({
        follower: user._id,
        following: targetUser._id
      });

      // Atomic increment on follower (+1 followingCount, +1 reputation point) and target (+1 followersCount)
      await Promise.all([
        User.findByIdAndUpdate(user._id, {
          $inc: {
            'stats.followingCount': 1,
            'stats.reputationPoints': 1
          }
        }),
        User.findByIdAndUpdate(targetUser._id, {
          $inc: { 'stats.followersCount': 1 }
        })
      ]);

      return res.status(200).json({
        success: true,
        isFollowing: true,
        message: 'Now following student.'
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve followers of a user
 * GET /api/profile/:id/followers
 */
async function getUserFollowers(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const follows = await Follow.find({ following: id })
      .populate('follower', 'fullName matricNumber level department bio avatar interests stats role verificationStatus createdAt')
      .sort({ createdAt: -1 });

    const followers = follows
      .filter((f) => f.follower)
      .map((f) => {
        const profile = f.follower.toPublicProfile ? f.follower.toPublicProfile() : f.follower;
        return {
          ...profile,
          follower: profile,
          followId: f._id,
          followedAt: f.createdAt
        };
      });

    return res.status(200).json({
      success: true,
      count: followers.length,
      followers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve users followed by a user
 * GET /api/profile/:id/following
 */
async function getUserFollowing(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const follows = await Follow.find({ follower: id })
      .populate('following', 'fullName matricNumber level department bio avatar interests stats role verificationStatus createdAt')
      .sort({ createdAt: -1 });

    const following = follows
      .filter((f) => f.following)
      .map((f) => {
        const profile = f.following.toPublicProfile ? f.following.toPublicProfile() : f.following;
        return {
          ...profile,
          following: profile,
          followId: f._id,
          followedAt: f.createdAt
        };
      });

    return res.status(200).json({
      success: true,
      count: following.length,
      following
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get follow relationship status between current user and target user
 * GET /api/profile/:id/follow-status
 */
async function getFollowStatus(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    const isFollowing = await Follow.exists({
      follower: req.user._id,
      following: targetUser._id
    });

    return res.status(200).json({
      success: true,
      isFollowing: Boolean(isFollowing)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  getFollowStatus
};
