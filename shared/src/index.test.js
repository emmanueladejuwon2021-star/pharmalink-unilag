const test = require('node:test');
const assert = require('node:assert');
const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  ACADEMIC_SESSIONS,
  SEMESTERS,
  resolveCurrentAcademicPeriod,
  isValidAcademicSession,
  isValidSemester,
  getNextLevel,
  levelToNumber
} = require('./index');

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

test('academic session list is in AY format and covers the resolved current session', () => {
  ACADEMIC_SESSIONS.forEach((s) => assert.strictEqual(isValidAcademicSession(s), true));
  const { session } = resolveCurrentAcademicPeriod(new Date());
  assert.ok(ACADEMIC_SESSIONS.includes(session), `current session ${session} must be listed`);
});

test('resolveCurrentAcademicPeriod follows the UNILAG August-to-July calendar', () => {
  // August 2026 -> 2026/2027 First Semester
  assert.deepStrictEqual(resolveCurrentAcademicPeriod(new Date(2026, 7, 15)), {
    session: '2026/2027',
    semester: 'First Semester'
  });
  // January 2027 -> still 2026/2027 First Semester
  assert.deepStrictEqual(resolveCurrentAcademicPeriod(new Date(2027, 0, 31)), {
    session: '2026/2027',
    semester: 'First Semester'
  });
  // February 2027 -> 2026/2027 Second Semester
  assert.deepStrictEqual(resolveCurrentAcademicPeriod(new Date(2027, 1, 1)), {
    session: '2026/2027',
    semester: 'Second Semester'
  });
  // July 2027 -> 2026/2027 Second Semester
  assert.deepStrictEqual(resolveCurrentAcademicPeriod(new Date(2027, 6, 30)), {
    session: '2026/2027',
    semester: 'Second Semester'
  });
});

test('session and semester validators reject bad input', () => {
  assert.strictEqual(isValidAcademicSession('2025/2026'), true);
  assert.strictEqual(isValidAcademicSession('2025/2027'), false); // non-consecutive
  assert.strictEqual(isValidAcademicSession('2025-2026'), false); // wrong separator
  assert.strictEqual(isValidAcademicSession(''), false);
  assert.strictEqual(isValidAcademicSession(null), false);
  assert.strictEqual(isValidSemester('First Semester'), true);
  assert.strictEqual(isValidSemester('Third Semester'), false);
  assert.deepStrictEqual(SEMESTERS, ['First Semester', 'Second Semester']);
});

test('level progression helpers', () => {
  assert.strictEqual(getNextLevel('200L'), '300L');
  assert.strictEqual(getNextLevel('400L'), '500L');
  assert.strictEqual(getNextLevel('500L'), null); // final eligible level
  assert.strictEqual(getNextLevel('100L'), null);
  assert.strictEqual(levelToNumber('300L'), 300);
  assert.strictEqual(levelToNumber('600L'), null);
});
