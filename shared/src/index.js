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
  levelToNumber
};
