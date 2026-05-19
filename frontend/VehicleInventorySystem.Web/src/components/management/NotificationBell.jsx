import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { apiFetch } from '../../services/api';

const formatNotificationTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const NotificationBell = ({ role, userId, className = 'admin-icon-btn' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const wrapRef = React.useRef(null);

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const query = role === 'Customer' && userId ? `?userId=${userId}` : `?role=${encodeURIComponent(role)}`;
      const response = await apiFetch(`/notifications${query}`);
      const list = Array.isArray(response) ? response : [];
      // Ensure newest-first ordering by createdAt (fallback in frontend)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  React.useEffect(() => {
    if (!role) return undefined;

    let isMounted = true;

    const refresh = async () => {
      if (!isMounted) return;
      await fetchNotifications();
    };

    const handleOutsideClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    refresh();
    window.addEventListener('vis:notifications-refresh', refresh);
    if (role === 'Admin') {
      window.addEventListener('vis:inventory-changed', refresh);
    }
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      isMounted = false;
      window.removeEventListener('vis:notifications-refresh', refresh);
      if (role === 'Admin') {
        window.removeEventListener('vis:inventory-changed', refresh);
      }
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [fetchNotifications, role]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markRead = async (notificationId) => {
    try {
      await apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' });
      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )));
    } catch {
    }
  };

  const markAllRead = async () => {
    try {
      const query = role === 'Customer' && userId ? `?userId=${userId}` : `?role=${encodeURIComponent(role)}`;
      await apiFetch(`/notifications/read-all${query}`, { method: 'PATCH' });
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch {
    }
  };

  return (
    <div className="admin-notification-wrap" ref={wrapRef}>
      <button
        type="button"
        className={className}
        aria-label="Notifications"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell size={16} />
        {unreadCount > 0 && <span className="admin-notification-dot" />}
      </button>

      {isOpen && (
        <div className="admin-notification-panel" role="dialog" aria-label="Notifications">
          <div className="admin-notification-panel-header">
            <div>
              <h4>Notifications</h4>
              <p>{unreadCount} unread item{unreadCount === 1 ? '' : 's'}</p>
            </div>
            <button type="button" className="admin-notification-loading" onClick={markAllRead} disabled={notifications.length === 0}>
              Mark all as read
            </button>
          </div>

          <div className="admin-notification-list">
            {isLoading && <div className="admin-notification-empty">Loading notifications...</div>}
            {!isLoading && notifications.length === 0 && (
              <div className="admin-notification-empty">No notifications yet.</div>
            )}

            {!isLoading && notifications.map((notification) => (
              <div key={notification.id} className={`admin-notification-item ${notification.isRead ? 'is-read' : 'is-unread'}`}>
                <div className="admin-notification-item-row">
                  <strong>{notification.title}</strong>
                  <span className="admin-notification-time">{formatNotificationTime(notification.createdAt)}</span>
                </div>
                <p>{notification.message}</p>
                <div className="admin-notification-actions">
                  {!notification.isRead ? (
                    <button type="button" className="admin-notification-action-btn" onClick={() => markRead(notification.id)}>
                      <CheckCheck size={14} />
                      <span>Mark as read</span>
                    </button>
                  ) : (
                    <span className="admin-notification-read-label">Read</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;