import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  Heart,
  MessageSquare,
  UserPlus,
  Download,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../api/notifications';
import { FALLBACK_NOTIFICATIONS } from '../data/mockFallbackData';

export default function NotificationsModal({
  isOpen,
  onClose,
  token,
  onNotificationCountChange
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  async function loadNotifications() {
    try {
      setLoading(true);
      if (token?.startsWith('demo-') || !token) {
        setNotifications(FALLBACK_NOTIFICATIONS);
        const unread = FALLBACK_NOTIFICATIONS.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
        if (onNotificationCountChange) onNotificationCountChange(unread);
        return;
      }
      const data = await fetchNotifications({ token });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      if (onNotificationCountChange) onNotificationCountChange(data.unreadCount || 0);
    } catch (err) {
      setNotifications(FALLBACK_NOTIFICATIONS);
      const unread = FALLBACK_NOTIFICATIONS.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      if (onNotificationCountChange) onNotificationCountChange(unread);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      if (token?.startsWith('demo-') || !token) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        const notif = FALLBACK_NOTIFICATIONS.find((n) => n._id === id);
        if (notif) notif.isRead = true;
        const remaining = FALLBACK_NOTIFICATIONS.filter((n) => !n.isRead).length;
        setUnreadCount(remaining);
        if (onNotificationCountChange) onNotificationCountChange(remaining);
        return;
      }
      const data = await markNotificationAsRead(id, { token });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(data.unreadCount);
      if (onNotificationCountChange) onNotificationCountChange(data.unreadCount);
    } catch (err) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      const notif = FALLBACK_NOTIFICATIONS.find((n) => n._id === id);
      if (notif) notif.isRead = true;
      const remaining = FALLBACK_NOTIFICATIONS.filter((n) => !n.isRead).length;
      setUnreadCount(remaining);
      if (onNotificationCountChange) onNotificationCountChange(remaining);
    }
  }

  async function handleMarkAllRead() {
    try {
      if (token?.startsWith('demo-') || !token) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        FALLBACK_NOTIFICATIONS.forEach((n) => (n.isRead = true));
        setUnreadCount(0);
        if (onNotificationCountChange) onNotificationCountChange(0);
        return;
      }
      await markAllNotificationsAsRead({ token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onNotificationCountChange) onNotificationCountChange(0);
    } catch (err) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      FALLBACK_NOTIFICATIONS.forEach((n) => (n.isRead = true));
      setUnreadCount(0);
      if (onNotificationCountChange) onNotificationCountChange(0);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'like':
        return <Heart size={14} color="#ef4444" />;
      case 'comment':
      case 'reply':
        return <MessageSquare size={14} color="#047857" />;
      case 'follow':
        return <UserPlus size={14} color="#0284c7" />;
      case 'material_download':
        return <Download size={14} color="#f59e0b" />;
      case 'announcement':
      case 'pans_broadcast':
        return <Megaphone size={14} color="#7e22ce" />;
      case 'verification_approved':
        return <CheckCircle2 size={14} color="#10b981" />;
      case 'verification_rejected':
        return <AlertCircle size={14} color="#ef4444" />;
      default:
        return <Bell size={14} color="#64748b" />;
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="notifications-modal-backdrop"
    >
      <div className="modal-container notifications-modal-container" data-testid="notifications-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Bell size={16} color="var(--primary, #047857)" />
            <span>Activity Notifications</span>
            {unreadCount > 0 && (
              <span
                data-testid="notifications-unread-count"
                style={{
                  background: 'var(--danger, #ef4444)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '999px',
                  padding: '1px 6px',
                  marginLeft: '4px'
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                data-testid="mark-all-read-btn"
                style={{
                  fontSize: '11px',
                  color: 'var(--primary, #047857)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Check size={13} /> Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-icon-close"
              data-testid="close-notifications-btn"
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="notif-list">
          {loading && (
            <div
              style={{ textAlign: 'center', padding: '28px 0', fontSize: '12px', color: 'var(--text-muted)' }}
              data-testid="notifications-loading"
            >
              <Loader2
                size={18}
                className="animate-spin"
                style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }}
              />
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div
              style={{ textAlign: 'center', padding: '36px 16px', fontSize: '12px', color: 'var(--text-muted)' }}
              data-testid="notifications-empty"
            >
              <Bell size={24} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              You're all caught up! No notifications yet.
            </div>
          )}

          {!loading &&
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                data-testid={`notification-item-${notif._id}`}
              >
                <div className="notif-icon-badge">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <p className="notif-message" data-testid={`notification-msg-${notif._id}`}>
                    {notif.message}
                  </p>
                  <span className="notif-time">
                    {new Date(notif.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    &bull;{' '}
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {!notif.isRead && <span className="unread-indicator-dot" />}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
