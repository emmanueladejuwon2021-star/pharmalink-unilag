const test = require('node:test');
const assert = require('node:assert');
const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  DEPARTMENTS,
  SEMESTERS,
  MATERIAL_TYPES,
  SEARCH_TYPES,
  NOTIFICATION_TYPES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  REPORT_CONTENT_TYPES,
  REPORT_REASONS,
  isValidMaterialType,
  isValidSearchType,
  isValidNotificationType,
  isValidAnnouncementCategory,
  isValidAnnouncementPriority,
  isValidReportContentType,
  isValidReportReason
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

test('defines search types and validates them', () => {
  assert.deepStrictEqual(SEARCH_TYPES, ['all', 'posts', 'materials', 'students']);
  assert.strictEqual(isValidSearchType('all'), true);
  assert.strictEqual(isValidSearchType('posts'), true);
  assert.strictEqual(isValidSearchType('materials'), true);
  assert.strictEqual(isValidSearchType('students'), true);
  assert.strictEqual(isValidSearchType('invalid'), false);
});

test('defines notification types and validates them', () => {
  assert.strictEqual(isValidNotificationType('like'), true);
  assert.strictEqual(isValidNotificationType('comment'), true);
  assert.strictEqual(isValidNotificationType('follow'), true);
  assert.strictEqual(isValidNotificationType('announcement'), true);
  assert.strictEqual(isValidNotificationType('fake_type'), false);
});

test('defines announcement categories and priorities', () => {
  assert.strictEqual(isValidAnnouncementCategory('General'), true);
  assert.strictEqual(isValidAnnouncementCategory('Academic'), true);
  assert.strictEqual(isValidAnnouncementCategory('Emergency'), true);
  assert.strictEqual(isValidAnnouncementCategory('FakeCategory'), false);

  assert.strictEqual(isValidAnnouncementPriority('normal'), true);
  assert.strictEqual(isValidAnnouncementPriority('urgent'), true);
  assert.strictEqual(isValidAnnouncementPriority('critical'), true);
  assert.strictEqual(isValidAnnouncementPriority('super'), false);
});

test('defines report types and reasons', () => {
  assert.strictEqual(isValidReportContentType('post'), true);
  assert.strictEqual(isValidReportContentType('comment'), true);
  assert.strictEqual(isValidReportContentType('material'), true);
  assert.strictEqual(isValidReportContentType('user'), true);
  assert.strictEqual(isValidReportContentType('unknown'), false);

  assert.strictEqual(isValidReportReason('misinformation'), true);
  assert.strictEqual(isValidReportReason('harassment'), true);
  assert.strictEqual(isValidReportReason('exam_malpractice'), true);
  assert.strictEqual(isValidReportReason('spam_spam'), false);
});
