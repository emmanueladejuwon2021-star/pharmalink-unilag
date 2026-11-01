const test = require('node:test');
const assert = require('node:assert');
const {
  POST_TYPES,
  POST_TITLE_MAX_LENGTH,
  POST_BODY_MAX_LENGTH,
  ANNOUNCEMENT_ROLES,
  isValidPostTitle,
  isValidPostBody,
  canPostAnnouncement,
  canViewPost,
  filterFeedPosts,
  compareFeedOrder,
  computeEngagementScore
} = require('./feed');

test('EPIC-006: post types and announcement roles are defined', () => {
  assert.deepStrictEqual(POST_TYPES, ['discussion', 'question', 'announcement']);
  assert.ok(ANNOUNCEMENT_ROLES.includes('pans_exec'));
  assert.ok(!ANNOUNCEMENT_ROLES.includes('student'));
});

test('EPIC-007: title validation enforces min/max length boundaries', () => {
  assert.strictEqual(isValidPostTitle('Pharmacy').valid, true);
  assert.strictEqual(isValidPostTitle('shor').valid, false); // < 5 chars
  assert.strictEqual(isValidPostTitle('x'.repeat(POST_TITLE_MAX_LENGTH + 1)).valid, false);
  assert.strictEqual(isValidPostTitle(null).valid, false);
});

test('EPIC-007: body validation rejects empty and oversized content', () => {
  assert.strictEqual(isValidPostBody('Any question?').valid, true);
  assert.strictEqual(isValidPostBody('   ').valid, false);
  assert.strictEqual(isValidPostBody('a'.repeat(POST_BODY_MAX_LENGTH + 1)).valid, false);
});

test('EPIC-006: only authorised roles may publish announcements', () => {
  for (const role of ANNOUNCEMENT_ROLES) {
    assert.strictEqual(canPostAnnouncement(role), true);
  }
  assert.strictEqual(canPostAnnouncement('student'), false);
});

test('EPIC-006: level-only posts visible to own level and seniors, not juniors', () => {
  const post = { type: 'discussion', visibility: 'level-only', targetLevel: '400L' };
  assert.strictEqual(canViewPost({ role: 'student', level: '400L' }, post), true);
  assert.strictEqual(canViewPost({ role: 'student', level: '500L' }, post), true);
  assert.strictEqual(canViewPost({ role: 'student', level: '300L' }, post), false);
  assert.strictEqual(canViewPost({ role: 'admin', level: '500L' }, post), true);
});

test('EPIC-006: announcements are visible to every member', () => {
  const post = { type: 'announcement', visibility: 'community' };
  assert.strictEqual(canViewPost({ role: 'student', level: '200L' }, post), true);
});

test('EPIC-006: feed filtering by tab and pinned-first ordering', () => {
  const viewer = { role: 'student', level: '300L' };
  const now = Date.now();
  const posts = [
    { _id: 'a', type: 'announcement', visibility: 'community', authorLevel: '500L', createdAt: new Date(now - 9e6), isPinned: true },
    { _id: 'b', type: 'discussion', visibility: 'community', authorLevel: '300L', createdAt: new Date(now - 1e6) },
    { _id: 'c', type: 'question', visibility: 'community', authorLevel: '200L', createdAt: new Date(now - 2e6) }
  ];
  const all = filterFeedPosts(posts, viewer, 'all');
  assert.strictEqual(all[0]._id, 'a', 'pinned announcement first');
  assert.strictEqual(all[1]._id, 'b', 'then newest');
  const questions = filterFeedPosts(posts, viewer, 'questions');
  assert.strictEqual(questions.length, 1);
  assert.strictEqual(questions[0]._id, 'c');
  const levelTab = filterFeedPosts(posts, viewer, 'level', '300L');
  assert.deepStrictEqual(levelTab.map((p) => p._id), ['b']);
});

test('EPIC-006: engagement score rewards likes and comments with recency decay', () => {
  const now = Date.now();
  const fresh = { likesCount: 5, commentsCount: 2, createdAt: new Date(now) };
  const stale = { likesCount: 5, commentsCount: 2, createdAt: new Date(now - 30 * 864e5) };
  assert.ok(computeEngagementScore(fresh, now) > computeEngagementScore(stale, now));
  assert.strictEqual(computeEngagementScore({ likesCount: 0, commentsCount: 0, createdAt: new Date(now) }, now), 0);
});

test('EPIC-006: compareFeedOrder keeps stable newest-first ordering', () => {
  const now = Date.now();
  const older = { isPinned: false, createdAt: new Date(now - 5e6) };
  const newer = { isPinned: false, createdAt: new Date(now - 1e6) };
  assert.ok(compareFeedOrder(newer, older) < 0);
});
