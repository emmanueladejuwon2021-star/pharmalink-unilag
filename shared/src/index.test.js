const test = require('node:test');
const assert = require('node:assert');
const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  DEPARTMENTS,
  SEMESTERS,
  MATERIAL_TYPES,
  isValidMaterialType
} = require('./main');

test('shared constants contains 200L to 500L', () => {
  assert.deepStrictEqual(ELIGIBLE_LEVELS, ['200L', '300L', '400L', '500L']);
  assert.strictEqual(ELIGIBLE_LEVELS.includes('100L'), false, '100L must not be eligible');
});

test('shared constants define all key roles', () => {
  assert.strictEqual(USER_ROLES.STUDENT, 'student');
  assert.strictEqual(USER_ROLES.ADMIN, 'admin');
  assert.strictEqual(USER_ROLES.PANS_EXEC, 'pans_exec');
});

test('verification lifecycle statuses', () => {
  assert.strictEqual(VERIFICATION_STATUS.UNVERIFIED, 'unverified');
  assert.strictEqual(VERIFICATION_STATUS.PENDING, 'pending');
  assert.strictEqual(VERIFICATION_STATUS.VERIFIED, 'verified');
});

test('contains 5 official UNILAG Pharmacy departments', () => {
  assert.strictEqual(DEPARTMENTS.length, 5);
  const codes = DEPARTMENTS.map(d => d.code);
  assert.deepStrictEqual(codes, ['CPH', 'PCH', 'PCT', 'PCG', 'PCL']);
});

test('contains first and second semesters', () => {
  assert.deepStrictEqual(SEMESTERS, ['First Semester', 'Second Semester']);
});

test('defines official material types and validates them', () => {
  const expectedTypes = [
    'Lecture Note',
    'Past Question',
    'Lab Resource',
    'Summary Sheet',
    'Textbook / Reference',
    'Article / Guide'
  ];
  assert.deepStrictEqual(MATERIAL_TYPES, expectedTypes);
  assert.strictEqual(isValidMaterialType('Lecture Note'), true);
  assert.strictEqual(isValidMaterialType('Past Question'), true);
  assert.strictEqual(isValidMaterialType('Lab Resource'), true);
  assert.strictEqual(isValidMaterialType('Summary Sheet'), true);
  assert.strictEqual(isValidMaterialType('Textbook / Reference'), true);
  assert.strictEqual(isValidMaterialType('Article / Guide'), true);
  assert.strictEqual(isValidMaterialType('Random File'), false);
  assert.strictEqual(isValidMaterialType(''), false);
  assert.strictEqual(isValidMaterialType(null), false);
});
