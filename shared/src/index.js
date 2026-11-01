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

// UNILAG academic sessions (AY format used by the Faculty of Pharmacy).
// The list is generated so it always covers recent and near-future sessions.
const ACADEMIC_SESSION_START_YEAR = 2023;

function buildAcademicSessions(currentEndYear = new Date().getFullYear() + 2) {
  const sessions = [];
  for (let start = ACADEMIC_SESSION_START_YEAR; start < currentEndYear; start++) {
    sessions.push(`${start}/${start + 1}`);
  }
  return sessions;
}

const ACADEMIC_SESSIONS = buildAcademicSessions();

// Academic semesters
const SEMESTERS = ['First Semester', 'Second Semester'];

/**
 * Resolve the active UNILAG academic session and semester from a calendar date.
 * UNILAG runs an August-to-July academic year:
 *  - First Semester:  August – January
 *  - Second Semester: February – July
 * Examples: Aug 2026 -> 2026/2027 First Semester; Jan 2027 -> 2026/2027 First
 * Semester; Feb 2027 -> 2026/2027 Second Semester.
 */
function resolveCurrentAcademicPeriod(date = new Date()) {
  const month = date.getMonth(); // 0 = January
  let startYear;
  let semester;

  if (month >= 7) {
    // August to December
    startYear = date.getFullYear();
    semester = SEMESTERS[0];
  } else if (month === 0) {
    // January still belongs to the academic year that started last August
    startYear = date.getFullYear() - 1;
    semester = SEMESTERS[0];
  } else {
    // February to July
    startYear = date.getFullYear() - 1;
    semester = SEMESTERS[1];
  }

  const endYear = startYear + 1;
  const session = `${startYear}/${String(endYear).slice(-4)}`;

  return { session, semester };
}

/**
 * Validate an academic session string in the UNILAG AY format (e.g. 2025/2026)
 */
function isValidAcademicSession(session) {
  if (!session || typeof session !== 'string') return false;
  const regex = /^(20\d{2})\/(20\d{2})$/;
  const match = session.trim().match(regex);
  if (!match) return false;
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  return end === start + 1;
}

/**
 * Validate a semester name
 */
function isValidSemester(semester) {
  return SEMESTERS.includes(semester);
}

/**
 * Level progression helper: the level a student advances to after one
 * successful academic year. 500L is the final eligible level.
 */
function getNextLevel(level) {
  const index = ELIGIBLE_LEVELS.indexOf(level);
  if (index === -1 || index === ELIGIBLE_LEVELS.length - 1) return null;
  return ELIGIBLE_LEVELS[index + 1];
}

/**
 * Convert a level string (e.g. '300L') to its numeric form (e.g. 300)
 */
function levelToNumber(level) {
  if (!ELIGIBLE_LEVELS.includes(level)) return null;
  return parseInt(level, 10);
}

// Document verification acceptable types
const VERIFICATION_DOC_TYPES = [
  'Faculty ID Card',
  'UNILAG Student ID Card',
  'Course Registration Form (Duly Signed)',
  'Docket / Exam Slip'
];


// ---------------------------------------------------------------------------
// EPIC-005: User Profiles and Identity
// ---------------------------------------------------------------------------

// Selectable academic interest areas shown on student profiles
const PROFILE_INTEREST_AREAS = [
  'Pharmacology',
  'Pharmaceutical Chemistry',
  'Pharmaceutics & Formulation',
  'Clinical Pharmacy & Therapeutics',
  'Pharmacognosy',
  'Hospital & Community Pharmacy',
  'Pharmaceutical Microbiology',
  'Research & Publications',
  'Exam Prep & Past Questions',
  'Student Welfare & Mentorship'
];

// Maximum lengths enforced on both client and server
const PROFILE_BIO_MAX_LENGTH = 300;
const PROFILE_NAME_MIN_LENGTH = 2;

/**
 * Derive display initials from a full name (max two letters).
 */
function getInitials(fullName) {
  if (!fullName || typeof fullName !== 'string') return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Deterministic avatar palette keyed off the matric number so every member
// sees the same colour everywhere (no uploaded images in original scope).
const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
  '#0891b2', '#4f46e5'
];

/**
 * Stable avatar colour derived from the user's identifier.
 */
function getAvatarColor(seed) {
  if (!seed || typeof seed !== 'string') return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Validate a list of interest areas against the allowed set.
 */
function isValidInterestList(interests) {
  if (!Array.isArray(interests)) return false;
  if (interests.length > PROFILE_INTEREST_AREAS.length) return false;
  return interests.every((i) => PROFILE_INTEREST_AREAS.includes(i));
}

/**
 * Validate an expected graduation year (UNILAG Pharmacy window 2025-2035).
 */
function isValidGraduatingYear(year) {
  const numeric = Number(year);
  return Number.isInteger(numeric) && numeric >= 2025 && numeric <= 2035;
}

/**
 * Weighted profile completeness score (0-100). Real data only: each field
 * contributes its weight, so the score tells members how complete their
 * identity is across the community.
 */
function computeProfileCompleteness(profile) {
  if (!profile) return 0;
  let score = 0;
  if (profile.fullName && String(profile.fullName).trim().length >= PROFILE_NAME_MIN_LENGTH) score += 20;
  if (profile.matricNumber) score += 20;
  if (profile.level) score += 15;
  if (profile.verificationStatus === 'verified') score += 20;
  if (profile.bio && String(profile.bio).trim().length > 0) score += 10;
  if (Array.isArray(profile.interests) && profile.interests.length > 0) score += 10;
  if (profile.graduatingYear) score += 5;
  return Math.min(score, 100);
}

/**
 * Private-community boundary helper: profile details may only be viewed by
 * verified members, or by the profile owner themselves.
 */
function isProfileViewable(viewer, target) {
  if (!viewer || !target) return false;
  const viewerId = String(viewer._id || viewer.id || '');
  const targetId = String(target._id || target.id || '');
  if (viewerId && viewerId === targetId) return true;
  return viewer.verificationStatus === 'verified';
}

module.exports = {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  MATERIAL_CATEGORIES,
  VERIFICATION_DOC_TYPES,
  ACADEMIC_SESSIONS,
  ACADEMIC_SESSION_START_YEAR,
  SEMESTERS,
  buildAcademicSessions,
  resolveCurrentAcademicPeriod,
  isValidAcademicSession,
  isValidSemester,
  getNextLevel,
  levelToNumber,
  PROFILE_INTEREST_AREAS,
  PROFILE_BIO_MAX_LENGTH,
  AVATAR_COLORS,
  getInitials,
  getAvatarColor,
  isValidInterestList,
  isValidGraduatingYear,
  computeProfileCompleteness,
  isProfileViewable
};
