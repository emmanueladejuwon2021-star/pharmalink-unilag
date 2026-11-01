const test = require('node:test');
const assert = require('node:assert');
const {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel,
  isValidVerificationDocType
} = require('./validation');

test('validates UNILAG student emails correctly', () => {
  assert.strictEqual(isValidUnilagEmail('student@live.unilag.edu.ng'), true);
  assert.strictEqual(isValidUnilagEmail('admin@unilag.edu.ng'), true);
  assert.strictEqual(isValidUnilagEmail('student@gmail.com'), false);
  assert.strictEqual(isValidUnilagEmail('student@oauife.edu.ng'), false);
  assert.strictEqual(isValidUnilagEmail(''), false);
  assert.strictEqual(isValidUnilagEmail(null), false);
});

test('validates UNILAG matric numbers correctly', () => {
  assert.strictEqual(isValidMatricNumber('190805501'), true);
  assert.strictEqual(isValidMatricNumber('12345678'), false); // 8 digits
  assert.strictEqual(isValidMatricNumber('1234567890'), false); // 10 digits
  assert.strictEqual(isValidMatricNumber('19080550A'), false); // non-digits
});

test('validates eligible pharmacy student levels', () => {
  assert.strictEqual(isValidLevel('200L'), true);
  assert.strictEqual(isValidLevel('300L'), true);
  assert.strictEqual(isValidLevel('400L'), true);
  assert.strictEqual(isValidLevel('500L'), true);
  assert.strictEqual(isValidLevel('100L'), false);
  assert.strictEqual(isValidLevel('600L'), false);
});

test('validates acceptable verification document types', () => {
  assert.strictEqual(isValidVerificationDocType('Faculty ID Card'), true);
  assert.strictEqual(isValidVerificationDocType('UNILAG Student ID Card'), true);
  assert.strictEqual(isValidVerificationDocType('Course Registration Form (Duly Signed)'), true);
  assert.strictEqual(isValidVerificationDocType('Docket / Exam Slip'), true);
  assert.strictEqual(isValidVerificationDocType('Driver License'), false);
  assert.strictEqual(isValidVerificationDocType(''), false);
});
