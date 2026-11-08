/**
 * BD-Pharm / UNILAG Shared Constants
 * Strict product boundaries and domain entities
 */

const {
  MATERIAL_TYPES,
  SEARCH_TYPES,
  NOTIFICATION_TYPES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  REPORT_CONTENT_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES
} = require('./constants');

// Eligible student academic levels in UNILAG Faculty of Pharmacy
const ELIGIBLE_LEVELS = ['200L', '300L', '400L', '500L'];

// Target audience levels for discussion posts
const POST_AUDIENCE_LEVELS = ['All Levels', '200L', '300L', '400L', '500L'];

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

// Discussion Post Categories (EPIC-006 & EPIC-007)
const POST_CATEGORIES = [
  'Academic Discussion',
  'Exam Preparation',
  'Lab & Practical',
  'General Announcement',
  'PANS Official',
  'Student Life'
];

// Feed Sort Options
const FEED_SORT_OPTIONS = ['latest', 'popular'];

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

// UNILAG Faculty of Pharmacy Academic Departments (EPIC-004)
const DEPARTMENTS = [
  {
    code: 'CPH',
    name: 'Clinical Pharmacy and Biopharmacy',
    description: 'Clinical therapeutics, patient care, biopharmaceutics, and clinical pharmacy practice.'
  },
  {
    code: 'PCH',
    name: 'Pharmaceutical Chemistry',
    description: 'Medicinal chemistry, pharmaceutical analysis, drug design, and organic synthesis.'
  },
  {
    code: 'PCT',
    name: 'Pharmaceutics and Pharmaceutical Technology',
    description: 'Dosage formulation, physical pharmacy, industrial manufacturing, and sterile compounding.'
  },
  {
    code: 'PCG',
    name: 'Pharmacognosy',
    description: 'Medicinal plants, natural products, phytochemistry, and herbal quality assurance.'
  },
  {
    code: 'PCL',
    name: 'Pharmacology, Therapeutics and Toxicology',
    description: 'Mechanisms of drug action, pharmacokinetics, organ toxicology, and applied therapeutics.'
  }
];

// Academic Semesters
const SEMESTERS = ['First Semester', 'Second Semester'];

module.exports = {
  ELIGIBLE_LEVELS,
  POST_AUDIENCE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  POST_CATEGORIES,
  FEED_SORT_OPTIONS,
  MATERIAL_CATEGORIES,
  MATERIAL_TYPES,
  SEARCH_TYPES,
  NOTIFICATION_TYPES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  REPORT_CONTENT_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES,
  VERIFICATION_DOC_TYPES,
  DEPARTMENTS,
  SEMESTERS,
  isValidMaterialType: (type) => require('./validation').isValidMaterialType(type),
  isValidSearchType: (type) => require('./validation').isValidSearchType(type),
  isValidNotificationType: (type) => require('./validation').isValidNotificationType(type),
  isValidAnnouncementCategory: (cat) => require('./validation').isValidAnnouncementCategory(cat),
  isValidAnnouncementPriority: (prio) => require('./validation').isValidAnnouncementPriority(prio),
  isValidReportContentType: (t) => require('./validation').isValidReportContentType(t),
  isValidReportReason: (r) => require('./validation').isValidReportReason(r)
};
