import { Trash2, ArrowUpRight } from 'lucide-react';

export default function SubtaskList({ subtasks, onToggle, onDelete, onConvert, readOnly = false }) {
  // Safety check in case subtasks is undefined
  if (!subtasks || subtasks.length === 0) return null;

  return (
    <div className="subtask-list">
      {subtasks.map((sub) => (
        <div key={sub.id} className={`subtask-item ${sub.completed ? 'completed' : ''}`}>
          <input
            type="checkbox"
            className="subtask-checkbox"
            checked={sub.completed}
            disabled={readOnly}
            onChange={() => onToggle(sub.id)}
          />
          <span className="subtask-title">{sub.title}</span>
          {!readOnly && (
            <div className="subtask-actions">
              <button
                className="subtask-action-btn"
                title="Convert to task"
                onClick={() => onConvert(sub.id)}
              >
                <ArrowUpRight />
              </button>
              <button
                className="subtask-action-btn"
                title="Delete"
                onClick={() => onDelete(sub.id)}
              >
                <Trash2 />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}