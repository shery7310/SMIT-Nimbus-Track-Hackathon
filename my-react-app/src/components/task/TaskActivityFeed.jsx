import { useSelector } from 'react-redux';
import { History, MessageSquare, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '../../utils/dateUtils';

export default function TaskActivityFeed({ taskId, onCommentClick }) {
  const entries = useSelector((state) =>
    state.activity.entries.filter((e) => e.taskId === taskId)
  );
  const users = useSelector((state) => state.auth.users);

  const userName = (id) => {
    const u = users.find((user) => user.id === id);
    return u ? `${u.firstName} ${u.lastName}` : 'Someone';
  };

  if (entries.length === 0) {
    return <p className="activity-empty">No activity yet on this task.</p>;
  }

  return (
    <div className="activity-feed">
      {entries.map((entry) => {
        const isComment = entry.type === 'commented';

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
            {isComment && onCommentClick && (
              <span className="activity-action-tag">
                View <ExternalLink style={{ width: 11, height: 11 }} />
              </span>
            )}
          </>
        );

        return isComment && onCommentClick ? (
          <button
            key={entry.id}
            type="button"
            className="activity-entry clickable-activity"
            onClick={() => onCommentClick(entry.commentId)}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
            title="Jump to this comment"
          >
            {content}
          </button>
        ) : (
          <div key={entry.id} className="activity-entry">
            {content}
          </div>
        );
      })}
    </div>
  );
}
