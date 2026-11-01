/**
 * UNILAG Student Email, Matric Number, and Verification Validators
 */

const { ELIGIBLE_LEVELS, USER_ROLES, VERIFICATION_DOC_TYPES } = require('./index');

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
 * Validate document verification type
 */
function isValidVerificationDocType(docType) {
  return VERIFICATION_DOC_TYPES.includes(docType);
}

module.exports = {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidVerificationDocType
};
