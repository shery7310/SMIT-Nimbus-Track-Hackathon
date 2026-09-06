export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)', style = {} }) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="task-card-skeleton">
      <Skeleton width="40%" height="12px" style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height="16px" style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="25%" height="18px" borderRadius="12px" />
        <Skeleton width="22px" height="22px" borderRadius="50%" />
      </div>
    </div>
  );
}

export function TaskListSkeleton({ count = 4 }) {
  return (
    <div className="task-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="task-row-skeleton">
          <Skeleton width="18px" height="18px" borderRadius="4px" />
          <Skeleton width="50%" height="14px" />
          <Skeleton width="15%" height="14px" />
          <Skeleton width="15%" height="14px" />
          <Skeleton width="24px" height="24px" borderRadius="50%" />
        </div>
      ))}
    </div>
  );
}
