const {
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
} = require('./index');

const {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel
} = require('./validation');

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
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel
};
