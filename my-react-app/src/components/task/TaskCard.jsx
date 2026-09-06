import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, CheckSquare, Copy, Trash2, ArrowRightLeft, Paperclip, AlertTriangle } from 'lucide-react';
import { toggleTaskComplete, duplicateTask, deleteTask } from '../../store/tasksSlice';
import { convertTaskToSubtask } from '../../store/tasksSlice';
import { getDueDateInfo, isTaskAtRisk } from '../../utils/dateUtils';
import { canEditTask, canDeleteTask, canCompleteTask } from '../../utils/permissions';

const STATUS_MAP = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

const PRIORITY_MAP = {
  low: { label: 'Low', class: 'priority-low' },
  medium: { label: 'Medium', class: 'priority-medium' },
  high: { label: 'High', class: 'priority-high' },
  urgent: { label: 'Urgent', class: 'priority-urgent' },
};

export default function TaskCard({ task, isSelected, onSelect, onClick, projectTasks }) {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.auth.users);
  const currentUser = useSelector((state) => state.auth.user);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const parentPickerRef = useRef(null);

  // Specific permission checks
  const canEdit = canEditTask(currentUser);       
  const canDelete = canDeleteTask(currentUser);   
  // Pass the task object so it can check if the user is the assignee
  const canMarkComplete = canCompleteTask(currentUser, task); 

  const assignee = allUsers.find((u) => u.id === task.assigneeId);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const dueInfo = getDueDateInfo(task.dueDate, task.status === 'done');
  const atRisk = isTaskAtRisk(task.dueDate, task.status);
  const otherTasks = projectTasks.filter((t) => t.id !== task.id);

  useEffect(() => {
    if (!showParentPicker) return;
    const onClickOutside = (e) => {
      if (parentPickerRef.current && !parentPickerRef.current.contains(e.target)) {
        setShowParentPicker(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showParentPicker]);

  const handleDuplicate = (e) => {
    e.stopPropagation();
    if (!canEdit) return;
    dispatch(duplicateTask(task.id));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!canDelete) return;
    dispatch(deleteTask(task.id));
  };

  const handleToggleParentPicker = (e) => {
    e.stopPropagation();
    setShowParentPicker((v) => !v);
  };

  const handlePickParent = (e, parentTaskId) => {
    e.stopPropagation();
    if (!canEdit) return;
    dispatch(convertTaskToSubtask({ taskId: task.id, parentTaskId }));
    setShowParentPicker(false);
  };

  return (
    <div
      className={`task-card ${isSelected ? 'task-card-selected' : ''} ${atRisk ? 'task-card-at-risk' : ''}`}
      onClick={onClick}
    >
      {canEdit && (
        <input
          type="checkbox"
          className="task-card-checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(task.id, e.target.checked);
          }}
        />
      )}

      <div className="task-card-body">
        <h4 className={`task-card-title ${task.status === 'done' ? 'task-card-title-done' : ''}`}>
          {atRisk && <AlertTriangle className="task-warning-icon" title="Due soon or overdue" />}
          {task.title}
        </h4>

        {task.description && (
          <p className="task-card-description">{task.description}</p>
        )}

        <div className="task-card-meta-row">
          <span className={`task-card-badge badge-${task.status}`}>
            {STATUS_MAP[task.status]}
          </span>

          <span className={`priority-dot ${PRIORITY_MAP[task.priority]?.class}`} title={task.priority} />

          {task.dueDate && (
            <span className={`task-due ${isOverdue ? 'task-due-overdue' : ''}`}>
              <Calendar />
              {new Date(task.dueDate).toLocaleDateString()}
              {dueInfo && <span className="task-due-relative"> · {dueInfo.label}</span>}
            </span>
          )}

          {task.labels && task.labels.slice(0, 2).map((label) => (
            <span key={label} className="task-label">{label}</span>
          ))}
          {task.labels && task.labels.length > 2 && (
            <span className="task-label">+{task.labels.length - 2}</span>
          )}

          {assignee && (
            <div className="task-assignee" style={{ background: 'var(--accent-blue)' }}>
              {assignee.firstName[0]}{assignee.lastName[0]}
            </div>
          )}

          {(task.attachments || []).length > 0 && (
            <span className="task-subtask-progress" title={`${task.attachments.length} attachment${task.attachments.length !== 1 ? 's' : ''}`}>
              <Paperclip style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {task.attachments.length}
            </span>
          )}

          {task.subtasks.length > 0 && (
            <span className="task-subtask-progress">
              <CheckSquare style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {completedSubtasks}/{task.subtasks.length}
            </span>
          )}
        </div>

        {task.subtasks.length > 0 && (
          <div className="task-progress-bar">
            <div className="task-progress-fill" style={{ width: `${subtaskProgress}%` }} />
          </div>
        )}
      </div>

      <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
        {/* Mark Complete Button - Clean styling, relies on your CSS for disabled state */}
        <button
          className="task-action-btn"
          title={canMarkComplete ? 'Mark complete' : 'Only the assignee or an Admin can mark this complete'}
          disabled={!canMarkComplete}
          onClick={(e) => {
            e.stopPropagation();
            if (!canMarkComplete) return;
            dispatch(toggleTaskComplete(task.id));
          }}
        >
          <CheckSquare />
        </button>

        {canEdit && (
          <button className="task-action-btn" title="Duplicate" onClick={handleDuplicate}>
            <Copy />
          </button>
        )}

        {canEdit && otherTasks.length > 0 && (
          <div style={{ position: 'relative' }} ref={parentPickerRef}>
            <button className="task-action-btn" title="Make subtask of..." onClick={handleToggleParentPicker}>
              <ArrowRightLeft />
            </button>
            {showParentPicker && (
              <div
                className="topbar-avatar-dropdown"
                style={{ right: 0, left: 'auto', minWidth: 200, maxHeight: 220, overflowY: 'auto' }}
              >
                <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--ink-400)' }}>
                  Make subtask of...
                </div>
                {otherTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    style={{ textAlign: 'left' }}
                    onClick={(e) => handlePickParent(e, t.id)}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {canDelete && (
          <button className="task-action-btn" title="Delete" onClick={handleDelete}>
            <Trash2 />
          </button>
        )}
      </div>
    </div>
  );
}