const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');
const {
  VERIFICATION_STATUS,
  USER_ROLES,
  isValidVerificationDocType
} = require('@pharmalink/shared');

/**
 * Submit verification request (Student)
 * POST /api/verification/submit
 */
async function submitVerification(req, res, next) {
  try {
    const student = req.user;

    // Reject if already verified
    if (student.verificationStatus === VERIFICATION_STATUS.VERIFIED) {
      return res.status(400).json({
        success: false,
        message: 'Your student account is already verified.'
      });
    }

    // Prevent duplicate active pending submissions
    const activePending = await VerificationRequest.findOne({
      user: student._id,
      status: VERIFICATION_STATUS.PENDING
    });

    if (activePending) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active verification request pending review.'
      });
    }

    const { documentType, documentUrl, fileName, fileSize } = req.body;

    // Validate document type
    if (!documentType || !isValidVerificationDocType(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing document type. Must be an acceptable UNILAG Pharmacy document.'
      });
    }

    // Validate document attachment/URL
    if (!documentUrl || typeof documentUrl !== 'string' || !documentUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Verification document file or attachment is required.'
      });
    }

    // Create verification request
    const verificationRequest = await VerificationRequest.create({
      user: student._id,
      matricNumber: student.matricNumber,
      fullName: student.fullName,
      level: student.level,
      documentType,
      documentUrl: documentUrl.trim(),
      fileName: fileName || 'verification_document',
      fileSize: fileSize || null,
      status: VERIFICATION_STATUS.PENDING
    });

    // Update student's verification status to pending
    student.verificationStatus = VERIFICATION_STATUS.PENDING;
    await student.save();

    return res.status(201).json({
      success: true,
      message: 'Verification document submitted successfully. Awaiting review by PANS administration.',
      verificationRequest
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current student's verification status and history
 * GET /api/verification/status
 */
async function getVerificationStatus(req, res, next) {
  try {
    const latestRequest = await VerificationRequest.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'fullName role');

    return res.status(200).json({
      success: true,
      verificationStatus: req.user.verificationStatus,
      currentRequest: latestRequest
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List verification requests (Admin / Moderator / PANS Exec)
 * GET /api/verification/requests
 */
async function listVerificationRequests(req, res, next) {
  try {
    const { status, level, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && Object.values(VERIFICATION_STATUS).includes(status)) {
      query.status = status;
    }
    if (level) {
      query.level = level;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      VerificationRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'fullName email matricNumber level')
        .populate('reviewedBy', 'fullName email role'),
      VerificationRequest.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      requests,
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
 * Review a verification request (Approve / Reject) (Admin / Moderator)
 * PATCH /api/verification/requests/:id/review
 */
async function reviewVerificationRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { action, rejectionReason, adminNotes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject".'
      });
    }

    if (action === 'reject' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required when rejecting a verification request.'
      });
    }

    const verificationRequest = await VerificationRequest.findById(id);
    if (!verificationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found.'
      });
    }

    if (verificationRequest.status !== VERIFICATION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `This verification request has already been reviewed (current status: ${verificationRequest.status}).`
      });
    }

    const student = await User.findById(verificationRequest.user);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Associated student account not found.'
      });
    }

    if (action === 'approve') {
      verificationRequest.status = VERIFICATION_STATUS.VERIFIED;
      verificationRequest.rejectionReason = null;
      verificationRequest.adminNotes = adminNotes ? adminNotes.trim() : null;
      verificationRequest.reviewedBy = req.user._id;
      verificationRequest.reviewedAt = new Date();
      await verificationRequest.save();

      student.verificationStatus = VERIFICATION_STATUS.VERIFIED;
      await student.save();

      return res.status(200).json({
        success: true,
        message: `Student ${student.fullName} has been successfully verified!`,
        verificationRequest
      });
    } else {
      verificationRequest.status = VERIFICATION_STATUS.REJECTED;
      verificationRequest.rejectionReason = rejectionReason.trim();
      verificationRequest.adminNotes = adminNotes ? adminNotes.trim() : null;
      verificationRequest.reviewedBy = req.user._id;
      verificationRequest.reviewedAt = new Date();
      await verificationRequest.save();

      student.verificationStatus = VERIFICATION_STATUS.REJECTED;
      await student.save();

      return res.status(200).json({
        success: true,
        message: `Verification request rejected. Reason: "${rejectionReason.trim()}". Student may re-submit.`,
        verificationRequest
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitVerification,
  getVerificationStatus,
  listVerificationRequests,
  reviewVerificationRequest
};
