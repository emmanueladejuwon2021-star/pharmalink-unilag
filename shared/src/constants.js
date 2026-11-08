/**
 * BD-Pharm / UNILAG Shared Constants
 */

const MATERIAL_TYPES = [
  'Lecture Note',
  'Past Question',
  'Lab Resource',
  'Summary Sheet',
  'Textbook / Reference',
  'Article / Guide'
];

const SEARCH_TYPES = ['all', 'posts', 'materials', 'students'];

const NOTIFICATION_TYPES = [
  'like',
  'comment',
  'reply',
  'follow',
  'material_download',
  'pans_broadcast',
  'announcement',
  'verification_approved',
  'verification_rejected',
  'system'
];

const ANNOUNCEMENT_CATEGORIES = [
  'General',
  'Academic',
  'Elections',
  'Events',
  'Dues & Welfare',
  'Emergency'
];

const ANNOUNCEMENT_PRIORITIES = ['normal', 'urgent', 'critical'];

const REPORT_CONTENT_TYPES = ['post', 'comment', 'material', 'user'];

const REPORT_REASONS = [
  'misinformation',
  'harassment',
  'exam_malpractice',
  'unauthorized_commercial',
  'inappropriate_content',
  'impersonation',
  'other'
];

const REPORT_STATUSES = ['pending', 'resolved', 'dismissed'];

module.exports = {
  MATERIAL_TYPES,
  SEARCH_TYPES,
  NOTIFICATION_TYPES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_PRIORITIES,
  REPORT_CONTENT_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES
};
