const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Material = require('../models/Material');
const Announcement = require('../models/Announcement');
const Report = require('../models/Report');
const { sendNotification } = require('./notificationController');
const { USER_ROLES, VERIFICATION_STATUS } = require('@pharmalink/shared');

/**
 * Get Platform Operational Metrics
 * GET /api/admin/metrics
 */
async function getAdminMetrics(req, res, next) {
  try {
    const [
      totalStudents,
      verifiedStudents,
      pendingVerifications,
      totalPosts,
      totalComments,
      totalMaterials,
      totalAnnouncements,
      pendingReports
    ] = await Promise.all([
      User.countDocuments({ isSuspended: { $ne: true } }),
      User.countDocuments({ verificationStatus: VERIFICATION_STATUS.VERIFIED }),
      VerificationRequest.countDocuments({ status: VERIFICATION_STATUS.PENDING }),
      Post.countDocuments({ isDeleted: { $ne: true } }),
      Comment.countDocuments({ isDeleted: { $ne: true } }),
      Material.countDocuments({ isDeleted: { $ne: true } }),
      Announcement.countDocuments({ isPublished: true }),
      Report.countDocuments({ status: 'pending' })
    ]);

    const materialStats = await Material.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadsCount' }, totalViews: { $sum: '$viewsCount' } } }
    ]);

    const totalDownloads = materialStats[0]?.totalDownloads || 0;
    const totalViews = materialStats[0]?.totalViews || 0;

    return res.status(200).json({
      success: true,
      metrics: {
        totalStudents,
        verifiedStudents,
        verificationRate: totalStudents > 0 ? Math.round((verifiedStudents / totalStudents) * 100) : 0,
        pendingVerifications,
        totalPosts,
        totalComments,
        totalMaterials,
        totalDownloads,
        totalViews,
        totalAnnouncements,
        pendingReports
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Student Verification Queue
 * GET /api/admin/verifications?status=pending|verified|rejected&level=...
 */
async function getVerificationQueue(req, res, next) {
  try {
    const { status = VERIFICATION_STATUS.PENDING, level } = req.query;

    const query = {};
    if (status) query.status = status;
    if (level) query.level = level;

    const requests = await VerificationRequest.find(query)
      .populate('user', 'fullName email matricNumber level department avatar verificationStatus createdAt')
      .populate('reviewedBy', 'fullName role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve Verification Request
 * POST /api/admin/verifications/:id/approve
 */
async function approveVerification(req, res, next) {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const verification = await VerificationRequest.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found.'
      });
    }

    if (verification.status === VERIFICATION_STATUS.VERIFIED) {
      return res.status(400).json({
        success: false,
        message: 'Student is already verified.'
      });
    }

    verification.status = VERIFICATION_STATUS.VERIFIED;
    verification.reviewedBy = adminUser._id;
    verification.reviewedAt = new Date();
    verification.rejectionReason = null;
    await verification.save();

    // Update student user record
    await User.findByIdAndUpdate(verification.user, {
      $set: { verificationStatus: VERIFICATION_STATUS.VERIFIED },
      $inc: { 'stats.reputationPoints': 10 } // Bonus on verification
    });

    // Send confirmation notification
    await sendNotification({
      recipient: verification.user,
      sender: adminUser._id,
      type: 'verification_approved',
      message: 'Congratulations! Your UNILAG Pharmacy student verification has been approved.'
    });

    return res.status(200).json({
      success: true,
      message: 'Student verification approved successfully.',
      verification
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject Verification Request
 * POST /api/admin/verifications/:id/reject
 */
async function rejectVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { reason = 'Document submitted could not be verified against faculty records.' } = req.body;
    const adminUser = req.user;

    const verification = await VerificationRequest.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found.'
      });
    }

    verification.status = VERIFICATION_STATUS.REJECTED;
    verification.rejectionReason = reason;
    verification.reviewedBy = adminUser._id;
    verification.reviewedAt = new Date();
    await verification.save();

    await User.findByIdAndUpdate(verification.user, {
      $set: { verificationStatus: VERIFICATION_STATUS.REJECTED }
    });

    await sendNotification({
      recipient: verification.user,
      sender: adminUser._id,
      type: 'verification_rejected',
      message: `Your verification request was rejected: ${reason}`
    });

    return res.status(200).json({
      success: true,
      message: 'Verification request marked as rejected.',
      verification
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Platform Users
 * GET /api/admin/users?role=...&level=...&search=...
 */
async function listUsers(req, res, next) {
  try {
    const { role, level, search, limit = 50 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (level) query.level = level;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ fullName: regex }, { matricNumber: regex }, { email: regex }];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 100));

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => u.toSafeObject())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update User Role
 * PATCH /api/admin/users/:id/role
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(USER_ROLES).join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle User Suspension
 * PATCH /api/admin/users/:id/suspend
 */
async function toggleUserSuspension(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own administrator account.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isSuspended ? 'User account suspended.' : 'User account reinstated.',
      isSuspended: user.isSuspended,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminMetrics,
  getVerificationQueue,
  approveVerification,
  rejectVerification,
  listUsers,
  updateUserRole,
  toggleUserSuspension
};
