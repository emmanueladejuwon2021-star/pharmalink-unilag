const test = require('node:test');
const assert = require('node:assert');
const {
  PROFILE_INTEREST_AREAS,
  PROFILE_BIO_MAX_LENGTH,
  getInitials,
  getAvatarColor,
  isValidInterestList,
  isValidGraduatingYear,
  computeProfileCompleteness,
  isProfileViewable
} = require('./index');

test('EPIC-005: interest areas are defined and non-empty', () => {
  assert.ok(Array.isArray(PROFILE_INTEREST_AREAS));
  assert.ok(PROFILE_INTEREST_AREAS.length >= 8);
  assert.ok(PROFILE_INTEREST_AREAS.includes('Pharmacology'));
});

test('EPIC-005: bio max length constant matches product spec', () => {
  assert.strictEqual(PROFILE_BIO_MAX_LENGTH, 300);
});

test('EPIC-005: getInitials handles full names, single names, and blanks', () => {
  assert.strictEqual(getInitials('Chioma Okeke'), 'CO');
  assert.strictEqual(getInitials('  Ada   Obi '), 'AO');
  assert.strictEqual(getInitials('Tunde'), 'T');
  assert.strictEqual(getInitials(''), '?');
  assert.strictEqual(getInitials(null), '?');
});

test('EPIC-005: avatar colour is deterministic for the same seed', () => {
  const a = getAvatarColor('190805123');
  const b = getAvatarColor('190805123');
  assert.strictEqual(a, b);
  assert.ok(PROFILE_INTEREST_AREAS && /^#[0-9a-f]{6}$/i.test(a));
});

test('EPIC-005: interest list validation rejects unknown areas', () => {
  assert.strictEqual(isValidInterestList(['Pharmacology']), true);
  assert.strictEqual(isValidInterestList([]), true);
  assert.strictEqual(isValidInterestList(['Football']), false);
  assert.strictEqual(isValidInterestList('Pharmacology'), false);
});

test('EPIC-005: graduation year window is 2025-2035', () => {
  assert.strictEqual(isValidGraduatingYear(2028), true);
  assert.strictEqual(isValidGraduatingYear('2030'), true);
  assert.strictEqual(isValidGraduatingYear(2024), false);
  assert.strictEqual(isValidGraduatingYear(2036), false);
  assert.strictEqual(isValidGraduatingYear(2028.5), false);
  assert.strictEqual(isValidGraduatingYear(null), false);
});

test('EPIC-005: completeness is weighted and capped at 100', () => {
  const empty = computeProfileCompleteness({});
  assert.strictEqual(empty, 0);

  const bareStudent = computeProfileCompleteness({
    fullName: 'A B',
    matricNumber: '123456789',
    level: '300L',
    verificationStatus: 'unverified'
  });
  assert.strictEqual(bareStudent, 55);

  const full = computeProfileCompleteness({
    fullName: 'A B',
    matricNumber: '123456789',
    level: '300L',
    verificationStatus: 'verified',
    bio: 'hello',
    interests: ['Pharmacology'],
    graduatingYear: 2028
  });
  assert.strictEqual(full, 100);
});

test('EPIC-005: profile viewing follows the private community boundary', () => {
  const owner = { _id: 'aaa', verificationStatus: 'unverified' };
  const stranger = { _id: 'bbb', verificationStatus: 'unverified' };
  const verifiedMember = { _id: 'ccc', verificationStatus: 'verified' };
  const target = { _id: 'aaa', verificationStatus: 'unverified' };

  // Owners can always see their own profile
  assert.strictEqual(isProfileViewable(owner, target), true);
  // Unverified visitors cannot browse other profiles
  assert.strictEqual(isProfileViewable(stranger, target), false);
  // Verified members can browse
  assert.strictEqual(isProfileViewable(verifiedMember, target), true);
  // Missing viewer is denied
  assert.strictEqual(isProfileViewable(null, target), false);
});
