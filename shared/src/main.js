const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  MATERIAL_CATEGORIES,
  VERIFICATION_DOC_TYPES,
  DEPARTMENTS,
  SEMESTERS
} = require('./index');

const {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidVerificationDocType,
  isValidDepartmentCode,
  isValidSemester,
  isValidAcademicSession,
  isValidCourseCode
} = require('./validation');

module.exports = {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  MATERIAL_CATEGORIES,
  VERIFICATION_DOC_TYPES,
  DEPARTMENTS,
  SEMESTERS,
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidVerificationDocType,
  isValidDepartmentCode,
  isValidSemester,
  isValidAcademicSession,
  isValidCourseCode
};
