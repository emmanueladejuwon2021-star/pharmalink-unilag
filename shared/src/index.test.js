const test = require('node:test');
const assert = require('node:assert');
const { ELIGIBLE_LEVELS, USER_ROLES, VERIFICATION_STATUS } = require('./index');

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
