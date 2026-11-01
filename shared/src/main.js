const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  MATERIAL_CATEGORIES,
  VERIFICATION_DOC_TYPES
} = require('./index');

const {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidVerificationDocType
} = require('./validation');

module.exports = {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  MATERIAL_CATEGORIES,
  VERIFICATION_DOC_TYPES,
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidVerificationDocType
};
