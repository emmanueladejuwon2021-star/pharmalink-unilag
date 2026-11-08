const {
  ELIGIBLE_LEVELS,
  POST_AUDIENCE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  POST_CATEGORIES,
  FEED_SORT_OPTIONS,
  MATERIAL_CATEGORIES,
  MATERIAL_TYPES,
  VERIFICATION_DOC_TYPES,
  DEPARTMENTS,
  SEMESTERS
} = require('./index');

const {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidPostTargetLevel,
  isValidPostCategory,
  isValidVerificationDocType,
  isValidDepartmentCode,
  isValidSemester,
  isValidAcademicSession,
  isValidCourseCode,
  isValidMaterialType
} = require('./validation');

module.exports = {
  ELIGIBLE_LEVELS,
  POST_AUDIENCE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  POST_CATEGORIES,
  FEED_SORT_OPTIONS,
  MATERIAL_CATEGORIES,
  MATERIAL_TYPES,
  VERIFICATION_DOC_TYPES,
  DEPARTMENTS,
  SEMESTERS,
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidPostTargetLevel,
  isValidPostCategory,
  isValidVerificationDocType,
  isValidDepartmentCode,
  isValidSemester,
  isValidAcademicSession,
  isValidCourseCode,
  isValidMaterialType
};
