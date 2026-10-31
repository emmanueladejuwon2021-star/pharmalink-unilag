/**
 * PharmaLink UNILAG Shared Constants
 * Strict product boundaries and domain entities
 */

// Eligible student academic levels in UNILAG Faculty of Pharmacy
const ELIGIBLE_LEVELS = ['200L', '300L', '400L', '500L'];

// System roles
const USER_ROLES = {
  STUDENT: 'student',
  LEVEL_REP: 'level_rep',
  PANS_EXEC: 'pans_exec',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Verification status lifecycle
const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Materials Vault categories
const MATERIAL_CATEGORIES = [
  'Lecture Notes',
  'Past Questions',
  'Lab Manuals & Reports',
  'Summaries',
  'Textbook References',
  'Exam Study Guides'
];

// Document verification acceptable types
const VERIFICATION_DOC_TYPES = [
  'Faculty ID Card',
  'UNILAG Student ID Card',
  'Course Registration Form (Duly Signed)',
  'Docket / Exam Slip'
];

module.exports = {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  MATERIAL_CATEGORIES,
  VERIFICATION_DOC_TYPES
};
