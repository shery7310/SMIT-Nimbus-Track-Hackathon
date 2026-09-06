// Returns a human-readable "days remaining" label for a due date, plus a
// tone string so callers can color it (overdue/today/soon/normal/done).
export function getDueDateInfo(dueDate, isDone = false) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (isDone) {
    return { label: 'Done', tone: 'done', diffDays };
  }
  if (diffDays < 0) {
    return { label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, tone: 'overdue', diffDays };
  }
  if (diffDays === 0) {
    return { label: 'Due today', tone: 'today', diffDays };
  }
  if (diffDays === 1) {
    return { label: 'Due tomorrow', tone: 'soon', diffDays };
  }
  if (diffDays <= 3) {
    return { label: `Due in ${diffDays} days`, tone: 'soon', diffDays };
  }
  return { label: `Due in ${diffDays} days`, tone: 'normal', diffDays };
}

// A task is "at risk" if it's not done and due today, due soon (≤3 days), or overdue.
export function isTaskAtRisk(dueDate, status) {
  if (status === 'done' || !dueDate) return false;
  const info = getDueDateInfo(dueDate, false);
  return info.tone === 'overdue' || info.tone === 'today' || info.tone === 'soon';
}

// "3 minutes ago", "5 hours ago", "on Sep 5" — used by activity feeds.
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const then = new Date(isoString);
  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return `on ${then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}