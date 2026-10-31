const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');
const { VERIFICATION_DOC_TYPES, VERIFICATION_STATUS } = require('@pharmalink/shared');

/**
 * Submit verification request
 * POST /api/verification/submit
 */
async function submitVerification(req, res, next) {
  try {
    const { documentType, documentUrl, studentNote } = req.body;

    if (!documentType || !documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your document type and upload proof.'
      });
    }

    if (!VERIFICATION_DOC_TYPES.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Please select an accepted document type (e.g. Faculty ID Card, UNILAG Student ID, Course Form, or Exam Slip).'
      });
    }

    // Check if user is already verified
    const currentUser = await User.findById(req.user._id);
    if (currentUser.verificationStatus === VERIFICATION_STATUS.VERIFIED) {
      return res.status(400).json({
        success: false,
        message: 'Your student account is already verified.'
      });
    }

    // Check if user already has a pending verification submission
    const existingPending = await VerificationRequest.findOne({
      user: req.user._id,
      status: VERIFICATION_STATUS.PENDING
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already have a verification request under review. Our team will verify it shortly.'
      });
    }

    // Create verification entry
    const request = new VerificationRequest({
      user: req.user._id,
      documentType,
      documentUrl,
      studentNote: studentNote ? studentNote.trim() : '',
      status: VERIFICATION_STATUS.PENDING
    });

    await request.save();

    // Update user status to pending
    currentUser.verificationStatus = VERIFICATION_STATUS.PENDING;
    await currentUser.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Your verification document has been submitted successfully for review.',
      request
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get student's own verification status and latest request
 * GET /api/verification/status
 */
async function getMyVerificationStatus(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    const latestRequest = await VerificationRequest.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      verificationStatus: user.verificationStatus,
      request: latestRequest || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin/Moderator: List all pending verification requests
 * GET /api/verification/admin/requests
 */
async function getPendingRequests(req, res, next) {
  try {
    const statusFilter = req.query.status || VERIFICATION_STATUS.PENDING;
    const query = statusFilter === 'all' ? {} : { status: statusFilter };

    const requests = await VerificationRequest.find(query)
      .populate('user', 'fullName email matricNumber level verificationStatus')
      .populate('reviewer', 'fullName email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin/Moderator: Review (Approve or Reject) a verification request
 * POST /api/verification/admin/review/:id
 */
async function reviewVerificationRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, reviewerNote } = req.body;

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review decision. Must be either "approve" or "reject".'
      });
    }

    const verificationReq = await VerificationRequest.findById(id);
    if (!verificationReq) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found.'
      });
    }

    const studentUser = await User.findById(verificationReq.user);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'The associated student account could not be found.'
      });
    }

    const newStatus = decision === 'approve' ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.REJECTED;

    verificationReq.status = newStatus;
    verificationReq.reviewer = req.user._id;
    verificationReq.reviewerNote = reviewerNote ? reviewerNote.trim() : '';
    verificationReq.reviewedAt = new Date();
    await verificationReq.save();

    studentUser.verificationStatus = newStatus;
    await studentUser.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: decision === 'approve'
        ? 'Student has been verified successfully.'
        : 'Verification request has been rejected.',
      request: verificationReq,
      student: studentUser.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitVerification,
  getMyVerificationStatus,
  getPendingRequests,
  reviewVerificationRequest
};
