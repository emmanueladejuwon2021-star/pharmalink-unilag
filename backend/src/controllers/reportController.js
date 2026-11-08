const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Material = require('../models/Material');
const User = require('../models/User');
const {
  isValidReportContentType,
  isValidReportReason
} = require('@pharmalink/shared');

/**
 * Submit content violation report
 * POST /api/reports
 */
async function createReport(req, res, next) {
  try {
    const user = req.user;

    // Strict boundary: Only verified pharmacy students can submit reports
    if (
      user.verificationStatus !== 'verified' &&
      user.role !== 'admin' &&
      user.role !== 'moderator'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to verified UNILAG Pharmacy students.'
      });
    }

    const { contentType, contentId, reason, description = '' } = req.body;

    if (!isValidReportContentType(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contentType. Must be one of: post, comment, material, user.'
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentId is required.'
      });
    }

    if (!isValidReportReason(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report reason.'
      });
    }

    // Verify existence of target entity
    if (contentType === 'post') {
      const exists = await Post.findOne({ _id: contentId, isDeleted: false });
      if (!exists) return res.status(404).json({ success: false, message: 'Target post not found.' });
    } else if (contentType === 'comment') {
      const exists = await Comment.findOne({ _id: contentId, isDeleted: false });
      if (!exists) return res.status(404).json({ success: false, message: 'Target comment not found.' });
    } else if (contentType === 'material') {
      const exists = await Material.findOne({ _id: contentId, isDeleted: false });
      if (!exists) return res.status(404).json({ success: false, message: 'Target material not found.' });
    } else if (contentType === 'user') {
      const exists = await User.findById(contentId);
      if (!exists) return res.status(404).json({ success: false, message: 'Target student not found.' });
    }

    // Check for existing pending report by same reporter
    const existing = await Report.findOne({
      reporter: user._id,
      contentId,
      status: 'pending'
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a report for this content that is currently pending review.'
      });
    }

    const report = new Report({
      reporter: user._id,
      contentType,
      contentId,
      reason,
      description: description.trim()
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our moderation team will review it.',
      report: report.toSafeReport()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve Reports for Moderation Review Queue
 * GET /api/reports?status=pending|resolved|dismissed&contentType=...
 */
async function getReports(req, res, next) {
  try {
    const { status = 'pending', contentType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;

    const reports = await Report.find(query)
      .populate('reporter', 'fullName matricNumber level department role avatar')
      .populate('resolvedBy', 'fullName role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports: reports.map((r) => r.toSafeReport())
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve or Dismiss a Moderation Report
 * PATCH /api/reports/:id/resolve
 */
async function resolveReport(req, res, next) {
  try {
    const { id } = req.params;
    const {
      status = 'resolved',
      resolutionAction = 'none',
      resolutionNotes = ''
    } = req.body;

    const moderator = req.user;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    report.status = status;
    report.resolutionAction = resolutionAction;
    report.resolutionNotes = resolutionNotes.trim();
    report.resolvedBy = moderator._id;
    report.resolvedAt = new Date();

    // Execute enforcement actions if content removal or suspension selected
    if (resolutionAction === 'content_removed') {
      if (report.contentType === 'post') {
        const removedPost = await Post.findOneAndUpdate(
          { _id: report.contentId, isDeleted: false },
          { $set: { isDeleted: true } }
        );
        if (removedPost) {
          await User.findByIdAndUpdate(removedPost.author, {
            $inc: { 'stats.postsCount': -1 }
          });
        }
      } else if (report.contentType === 'comment') {
        const removedComment = await Comment.findOneAndUpdate(
          { _id: report.contentId, isDeleted: false },
          { $set: { isDeleted: true } }
        );
        if (removedComment) {
          await Post.findByIdAndUpdate(removedComment.post, {
            $inc: { commentsCount: -1 }
          });
        }
      } else if (report.contentType === 'material') {
        const removedMaterial = await Material.findOneAndUpdate(
          { _id: report.contentId, isDeleted: false },
          { $set: { isDeleted: true } }
        );
        if (removedMaterial) {
          await User.findByIdAndUpdate(removedMaterial.uploader, {
            $inc: { 'stats.materialsCount': -1 }
          });
        }
      }
    } else if (resolutionAction === 'user_suspended') {
      if (report.contentType === 'user') {
        await User.findByIdAndUpdate(report.contentId, { $set: { isSuspended: true } });
      }
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report marked as ${status}.`,
      report: report.toSafeReport()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  getReports,
  resolveReport
};
