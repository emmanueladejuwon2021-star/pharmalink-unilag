/**
 * EPIC-006 / EPIC-007: Social Feed and Post Management — shared domain logic.
 *
 * These helpers are used by both the backend API and the frontend so that
 * content rules (length limits, post types, feed filtering and sorting)
 * behave identically everywhere.
 */

// Content type of a community post
const POST_TYPES = ['discussion', 'question', 'announcement'];

// Who can see a post
const POST_VISIBILITIES = ['community', 'level-only'];

// Product boundaries (from the Blueprint / PRD)
const POST_TITLE_MAX_LENGTH = 140;
const POST_TITLE_MIN_LENGTH = 5;
const POST_BODY_MAX_LENGTH = 5000;
const POST_BODY_MIN_LENGTH = 2;
const POST_LEVELS = ['all', '200L', '300L', '400L', '500L'];

// Roles allowed to publish official announcements to the whole community
const ANNOUNCEMENT_ROLES = ['admin', 'moderator', 'pans_exec', 'level_rep'];

/**
 * Validate a post title. Returns { valid, message }.
 */
function isValidPostTitle(title) {
  if (typeof title !== 'string') {
    return { valid: false, message: 'Post title must be text.' };
  }
  const trimmed = title.trim();
  if (trimmed.length < POST_TITLE_MIN_LENGTH) {
    return { valid: false, message: `Post title must be at least ${POST_TITLE_MIN_LENGTH} characters.` };
  }
  if (trimmed.length > POST_TITLE_MAX_LENGTH) {
    return { valid: false, message: `Post title must be ${POST_TITLE_MAX_LENGTH} characters or fewer.` };
  }
  return { valid: true, message: '' };
}

/**
 * Validate a post body. Returns { valid, message }.
 */
function isValidPostBody(body) {
  if (typeof body !== 'string') {
    return { valid: false, message: 'Post content must be text.' };
  }
  const trimmed = body.trim();
  if (trimmed.length < POST_BODY_MIN_LENGTH) {
    return { valid: false, message: 'Post content cannot be empty.' };
  }
  if (trimmed.length > POST_BODY_MAX_LENGTH) {
    return { valid: false, message: `Post content must be ${POST_BODY_MAX_LENGTH} characters or fewer.` };
  }
  return { valid: true, message: '' };
}

/**
 * Whether a role is permitted to publish an official announcement.
 */
function canPostAnnouncement(role) {
  return ANNOUNCEMENT_ROLES.includes(role);
}

/**
 * Server-side visibility check: may `viewer` see `post`?
 * - Announcements are visible to every authenticated member.
 * - Level-only posts are visible to their level, senior levels, and staff.
 * - Community posts are visible to all verified members.
 */
function canViewPost(viewer, post) {
  if (!viewer || !post) return false;
  if (post.type === 'announcement') return true;
  if (viewer.role && viewer.role !== 'student') return true;
  if (post.visibility === 'level-only' && post.targetLevel && post.targetLevel !== 'all') {
    const rank = (level) => parseInt(level, 10) || 0;
    // Seniors may look down-level, never up into another year's private space
    return rank(viewer.level) >= rank(post.targetLevel);
  }
  return true;
}

/**
 * Sort key for the "Latest" feed tab: pinned announcements first, then newest.
 */
function compareFeedOrder(a, b) {
  const pinA = a.isPinned ? 1 : 0;
  const pinB = b.isPinned ? 1 : 0;
  if (pinA !== pinB) return pinB - pinA;
  const dateA = new Date(a.pinnedAt || a.createdAt).getTime();
  const dateB = new Date(b.pinnedAt || b.createdAt).getTime();
  return dateB - dateA;
}

/**
 * Filter posts for a viewer across feed tabs.
 * tab: 'all' | 'discussions' | 'questions' | 'announcements' | 'level'
 * level: target level when tab === 'level'
 */
function filterFeedPosts(posts, viewer, tab = 'all', level = null) {
  let list = posts.filter((p) => canViewPost(viewer, p));
  if (tab === 'discussions') list = list.filter((p) => p.type === 'discussion');
  else if (tab === 'questions') list = list.filter((p) => p.type === 'question');
  else if (tab === 'announcements') list = list.filter((p) => p.type === 'announcement');
  else if (tab === 'level' && level) list = list.filter((p) => p.authorLevel === level);
  return [...list].sort(compareFeedOrder);
}

/**
 * Lightweight relevance score for the "Top" ordering: engagement weighted
 * with a small recency boost. Deterministic and dependency-free.
 */
function computeEngagementScore(post, nowMs = Date.now()) {
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const base = likes * 2 + comments * 3;
  const ageHours = Math.max(1, (nowMs - new Date(post.createdAt).getTime()) / 36e5);
  return base / Math.sqrt(ageHours);
}

module.exports = {
  POST_TYPES,
  POST_VISIBILITIES,
  POST_TITLE_MAX_LENGTH,
  POST_TITLE_MIN_LENGTH,
  POST_BODY_MAX_LENGTH,
  POST_BODY_MIN_LENGTH,
  POST_LEVELS,
  ANNOUNCEMENT_ROLES,
  isValidPostTitle,
  isValidPostBody,
  canPostAnnouncement,
  canViewPost,
  compareFeedOrder,
  filterFeedPosts,
  computeEngagementScore
};
