import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { History, X, MessageSquare, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

const TYPE_LABELS = {
  created: 'Created',
  edited: 'Edited',
  status_changed: 'Status changed',
  deleted: 'Deleted',
  commented: 'Commented',
};

export default function ProjectActivityFeed({ projectId, onCommentClick, onTaskClick }) {
  const [userFilter, setUserFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allEntries = useSelector((state) =>
    state.activity.entries.filter((e) => e.projectId === projectId)
  );
  const users = useSelector((state) => state.auth.users);
  const currentUser = useSelector((state) => state.auth.user);

  const involvedUsers = useMemo(() => {
    const ids = [...new Set(allEntries.map((e) => e.actingUserId))];
    return users.filter((u) => ids.includes(u.id));
  }, [allEntries, users]);

  const entries = useMemo(
    () =>
      allEntries.filter(
        (e) =>
          (userFilter === 'all' || e.actingUserId === userFilter) &&
          (typeFilter === 'all' || e.type === typeFilter)
      ),
    [allEntries, userFilter, typeFilter]
  );

  const userName = (id) => {
    const u = users.find((user) => user.id === id);
    return u ? `${u.firstName} ${u.lastName}` : 'Someone';
  };

  const hasFilters = userFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="ws-settings-section" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h3 className="ws-settings-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History style={{ width: 16, height: 16 }} />
          Activity ({allEntries.length})
        </h3>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="auth-input"
            style={{ width: 'auto' }}
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="all">Everyone</option>
            {involvedUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
          <select
            className="auth-input"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All actions</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              className="topbar-icon-btn"
              title="Clear filters"
              onClick={() => {
                setUserFilter('all');
                setTypeFilter('all');
              }}
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>
      </div>

      <div className="activity-feed" style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <p className="activity-empty">
            {allEntries.length === 0 ? 'No activity yet on this project.' : 'No activity matches these filters.'}
          </p>
        ) : (
          entries.map((entry) => {
            const isComment = entry.type === 'commented' && entry.taskId;
            const isClickable = isComment || (entry.taskId && entry.type !== 'deleted');

            const content = (
              <>
                {isComment ? (
                  <MessageSquare className="activity-entry-icon" style={{ color: 'var(--accent-blue)' }} />
                ) : (
                  <History className="activity-entry-icon" />
                )}
                <div className="activity-entry-body">
                  <span>
                    <strong>{userName(entry.actingUserId)}</strong> {entry.message}
                  </span>
                  <span className="activity-entry-time">{formatRelativeTime(entry.timestamp)}</span>
                </div>

                {isComment && (
                  <span
                    className="activity-action-tag"
                    title="Click to view and moderate this comment"
                  >
                    View comment <ExternalLink style={{ width: 11, height: 11 }} />
                  </span>
                )}
              </>
            );

            if (isClickable) {
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`activity-entry clickable-activity ${isComment ? 'comment-activity-item' : ''}`}
                  onClick={() => {
                    if (isComment && onCommentClick) {
                      onCommentClick(entry.taskId, entry.commentId);
                    } else if (onTaskClick && entry.taskId) {
                      onTaskClick(entry.taskId);
                    }
                  }}
                  title={
                    isComment
                      ? 'Click to open task and moderate/delete comment'
                      : 'Click to open task details'
                  }
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={entry.id} className="activity-entry">
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
