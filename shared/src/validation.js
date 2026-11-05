/**
 * BD-Pharm / UNILAG Student Email, Matric Number, and Academic Structure Validators
 */

const {
  ELIGIBLE_LEVELS,
  POST_AUDIENCE_LEVELS,
  POST_CATEGORIES,
  USER_ROLES,
  VERIFICATION_DOC_TYPES,
  DEPARTMENTS,
  SEMESTERS
} = require('./index');

/**
 * Validate UNILAG student email
 * Allowed domains: @live.unilag.edu.ng or @unilag.edu.ng
 */
function isValidUnilagEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@(live\.)?unilag\.edu\.ng$/i;
  return regex.test(email.trim());
}

/**
 * Validate UNILAG Matriculation Number (typically 9 digits)
 */
function isValidMatricNumber(matric) {
  if (!matric || typeof matric !== 'string') return false;
  const regex = /^\d{9}$/;
  return regex.test(matric.trim());
}

/**
 * Validate student academic level
 */
function isValidLevel(level) {
  return ELIGIBLE_LEVELS.includes(level);
}

/**
 * Validate target audience level for posts
 */
function isValidPostTargetLevel(level) {
  if (!level || typeof level !== 'string') return false;
  return POST_AUDIENCE_LEVELS.includes(level.trim());
}

/**
 * Validate post category
 */
function isValidPostCategory(category) {
  if (!category || typeof category !== 'string') return false;
  return POST_CATEGORIES.includes(category.trim());
}

/**
 * Validate document verification type
 */
function isValidVerificationDocType(docType) {
  return VERIFICATION_DOC_TYPES.includes(docType);
}

/**
 * Validate Department Code
 */
function isValidDepartmentCode(code) {
  if (!code || typeof code !== 'string') return false;
  return DEPARTMENTS.some((dept) => dept.code === code.trim().toUpperCase());
}

/**
 * Validate Semester
 */
function isValidSemester(semester) {
  return SEMESTERS.includes(semester);
}

/**
 * Validate Academic Session (e.g. 2024/2025)
 */
function isValidAcademicSession(session) {
  if (!session || typeof session !== 'string') return false;
  return /^\d{4}\/\d{4}$/.test(session.trim());
}

/**
 * Validate Course Code (e.g., "PCH 301", "PCT 402")
 */
function isValidCourseCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z]{3}\s\d{3}$/.test(code.trim().toUpperCase());
}

module.exports = {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidPostTargetLevel,
  isValidPostCategory,
  isValidVerificationDocType,
  isValidDepartmentCode,
  isValidSemester,
  isValidAcademicSession,
  isValidCourseCode
};
