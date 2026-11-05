const test = require('node:test');
const assert = require('node:assert');
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
  isValidCourseCode
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

test('validates post target audience level', () => {
  assert.strictEqual(isValidPostTargetLevel('All Levels'), true);
  assert.strictEqual(isValidPostTargetLevel('200L'), true);
  assert.strictEqual(isValidPostTargetLevel('300L'), true);
  assert.strictEqual(isValidPostTargetLevel('400L'), true);
  assert.strictEqual(isValidPostTargetLevel('500L'), true);
  assert.strictEqual(isValidPostTargetLevel('100L'), false);
});

test('validates post category', () => {
  assert.strictEqual(isValidPostCategory('Academic Discussion'), true);
  assert.strictEqual(isValidPostCategory('Exam Preparation'), true);
  assert.strictEqual(isValidPostCategory('Lab & Practical'), true);
  assert.strictEqual(isValidPostCategory('General Announcement'), true);
  assert.strictEqual(isValidPostCategory('PANS Official'), true);
  assert.strictEqual(isValidPostCategory('Student Life'), true);
  assert.strictEqual(isValidPostCategory('Random Spam'), false);
});

test('validates acceptable verification document types', () => {
  assert.strictEqual(isValidVerificationDocType('Faculty ID Card'), true);
  assert.strictEqual(isValidVerificationDocType('UNILAG Student ID Card'), true);
  assert.strictEqual(isValidVerificationDocType('Course Registration Form (Duly Signed)'), true);
  assert.strictEqual(isValidVerificationDocType('Docket / Exam Slip'), true);
  assert.strictEqual(isValidVerificationDocType('Driver License'), false);
  assert.strictEqual(isValidVerificationDocType(''), false);
});

test('validates pharmacy department codes', () => {
  assert.strictEqual(isValidDepartmentCode('CPH'), true);
  assert.strictEqual(isValidDepartmentCode('PCH'), true);
  assert.strictEqual(isValidDepartmentCode('PCT'), true);
  assert.strictEqual(isValidDepartmentCode('PCG'), true);
  assert.strictEqual(isValidDepartmentCode('PCL'), true);
  assert.strictEqual(isValidDepartmentCode('cph'), true); // case-insensitive
  assert.strictEqual(isValidDepartmentCode('MED'), false);
  assert.strictEqual(isValidDepartmentCode(''), false);
});

test('validates academic semesters', () => {
  assert.strictEqual(isValidSemester('First Semester'), true);
  assert.strictEqual(isValidSemester('Second Semester'), true);
  assert.strictEqual(isValidSemester('Summer Semester'), false);
});

test('validates academic session format (YYYY/YYYY)', () => {
  assert.strictEqual(isValidAcademicSession('2024/2025'), true);
  assert.strictEqual(isValidAcademicSession('2025/2026'), true);
  assert.strictEqual(isValidAcademicSession('2024-2025'), false);
  assert.strictEqual(isValidAcademicSession('2024'), false);
});

test('validates course codes format', () => {
  assert.strictEqual(isValidCourseCode('PCH 301'), true);
  assert.strictEqual(isValidCourseCode('PCT 402'), true);
  assert.strictEqual(isValidCourseCode('CPH 501'), true);
  assert.strictEqual(isValidCourseCode('pch 301'), true);
  assert.strictEqual(isValidCourseCode('PCH301'), false); // missing space
  assert.strictEqual(isValidCourseCode('PHARM 301'), false); // 5 letters
});
