import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionLabel = null,
  onAction = null,
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrap">
        <Icon className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: 12 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
