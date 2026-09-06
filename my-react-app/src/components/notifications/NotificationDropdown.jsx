import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  MessageSquare,
  UserCheck,
  Clock,
  Info,
} from 'lucide-react';
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  updatePreference,
} from '../../store/notificationsSlice';
import { formatRelativeTime } from '../../utils/dateUtils';

export default function NotificationDropdown({ onOpenComment }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'settings'
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const notifications = useSelector((state) => state.notifications?.notifications || []);
  const preferences = useSelector(
    (state) => state.notifications?.preferences || { assigned: true, mentioned: true, due_soon: true }
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleNotificationClick = (n) => {
    if (!n.read) {
      dispatch(markAsRead(n.id));
    }
    if (n.commentId && onOpenComment) {
      onOpenComment(n.taskId, n.commentId);
      setIsOpen(false);
    } else if (n.workspaceId && n.projectId) {
      navigate(`/workspace/${n.workspaceId}/project/${n.projectId}`);
      setIsOpen(false);
    } else if (n.workspaceId) {
      navigate(`/workspace/${n.workspaceId}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mentioned':
        return <MessageSquare className="notif-icon-type mention" />;
      case 'assigned':
        return <UserCheck className="notif-icon-type assign" />;
      case 'due_soon':
        return <Clock className="notif-icon-type due" />;
      default:
        return <Info className="notif-icon-type default" />;
    }
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="topbar-icon-btn notif-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <div className="notif-title-row">
              <h4 className="notif-title">Notifications</h4>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notif-action-text-btn"
                    onClick={() => dispatch(markAllAsRead())}
                    title="Mark all as read"
                  >
                    <CheckCheck style={{ width: 14, height: 14 }} />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="notif-action-text-btn"
                    onClick={() => dispatch(clearNotifications())}
                    title="Clear all notifications"
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            </div>

            <div className="notif-tabs">
              <button
                type="button"
                className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                className={`notif-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                title="Notification preferences"
              >
                <Settings style={{ width: 12, height: 12 }} />
                Preferences
              </button>
            </div>
          </div>

          <div className="notif-body">
            {activeTab === 'settings' ? (
              <div className="notif-prefs-panel">
                <p className="notif-prefs-hint">Choose which in-app notification triggers are active:</p>
                <label className="notif-toggle-row">
                  <div>
                    <strong>Assigned to task</strong>
                    <span className="notif-toggle-desc">When someone assigns you to a task</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.assigned !== false}
                    onChange={(e) => dispatch(updatePreference({ key: 'assigned', value: e.target.checked }))}
                  />
                </label>

                <label className="notif-toggle-row">
                  <div>
                    <strong>Mentioned in comments</strong>
                    <span className="notif-toggle-desc">When someone @mentions you in a discussion</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.mentioned !== false}
                    onChange={(e) => dispatch(updatePreference({ key: 'mentioned', value: e.target.checked }))}
                  />
                </label>

                <label className="notif-toggle-row">
                  <div>
                    <strong>Due dates approaching</strong>
                    <span className="notif-toggle-desc">When an assigned task is due soon or overdue</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.due_soon !== false}
                    onChange={(e) => dispatch(updatePreference({ key: 'due_soon', value: e.target.checked }))}
                  />
                </label>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notif-empty">
                <Check className="notif-empty-icon" />
                <p>No {activeTab === 'unread' ? 'unread ' : ''}notifications right now.</p>
              </div>
            ) : (
              <div className="notif-items-list">
                {filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {getNotificationIcon(n.type)}
                    <div className="notif-item-body">
                      <div className="notif-item-title-row">
                        <span className="notif-item-title">{n.title}</span>
                        {!n.read && <span className="notif-unread-dot" />}
                      </div>
                      <p className="notif-item-message">{n.message}</p>
                      <span className="notif-item-time">{formatRelativeTime(n.createdAt)}</span>
                    </div>

                    <div className="notif-item-actions" onClick={(e) => e.stopPropagation()}>
                      {!n.read && (
                        <button
                          type="button"
                          className="notif-item-btn"
                          title="Mark as read"
                          onClick={() => dispatch(markAsRead(n.id))}
                        >
                          <Check style={{ width: 13, height: 13 }} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-item-btn"
                        title="Delete notification"
                        onClick={() => dispatch(deleteNotification(n.id))}
                      >
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
