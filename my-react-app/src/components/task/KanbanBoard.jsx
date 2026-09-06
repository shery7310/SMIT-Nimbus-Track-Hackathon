import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, X, ChevronLeft, ChevronRight, Calendar, CheckSquare } from 'lucide-react';
import { moveTaskToColumn, updateTask } from '../../store/tasksSlice';
import { createColumn, renameColumn, deleteColumn, reorderColumns } from '../../store/projectsSlice';
import { canEditTask, canSetStatus } from '../../utils/permissions';
import { getDueDateInfo, isTaskAtRisk } from '../../utils/dateUtils';

const COLUMN_STATUS_MAP = {
  col_todo: 'todo',
  col_in_progress: 'in-progress',
  col_done: 'done',
};

const PRIORITY_CLASS = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', urgent: 'priority-urgent' };

export default function KanbanBoard({ projectId, columns = [], tasks, onTaskClick }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const allUsers = useSelector((state) => state.auth.users);

  const canEdit = canEditTask(currentUser);

  const [dragOverColId, setDragOverColId] = useState(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColId, setEditingColId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const fallbackColumnId = sortedColumns[0]?.id;

  const tasksForColumn = (columnId) =>
    tasks.filter((t) => (t.columnId || fallbackColumnId) === columnId);

  const handleDragStart = (e, task) => {
    // Allow drag if user is Admin OR if user is the assignee of this specific task
    const canDrag = canEdit || canSetStatus(currentUser, task.status, task);
    if (!canDrag) return;
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDrop = (e, column) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.columnId === column.id) return;

    // Double-check permission on drop
    const canDrag = canEdit || canSetStatus(currentUser, task.status, task);
    if (!canDrag) return;

    const mappedStatus = COLUMN_STATUS_MAP[column.id];
    if (mappedStatus && !canSetStatus(currentUser, mappedStatus, task)) {
      return; // Refuse the move if they don't have permission for the target status
    }

    dispatch(moveTaskToColumn({ taskId, columnId: column.id }));
    if (mappedStatus && mappedStatus !== task.status) {
      dispatch(updateTask({ id: taskId, changes: { status: mappedStatus } }));
    }
  };

  const handleAddColumn = () => {
    if (!canEdit) return;
    if (!newColumnName.trim()) return;
    dispatch(createColumn({ projectId, name: newColumnName.trim() }));
    setNewColumnName('');
    setAddingColumn(false);
  };

  const startRename = (col) => {
    if (!canEdit) return;
    setEditingColId(col.id);
    setEditingName(col.name);
  };

  const commitRename = () => {
    if (!canEdit) return;
    if (editingName.trim()) {
      dispatch(renameColumn({ projectId, columnId: editingColId, name: editingName.trim() }));
    }
    setEditingColId(null);
  };

  const handleDeleteColumn = (col) => {
    if (!canEdit) return;
    if (sortedColumns.length <= 1) return;
    const remaining = sortedColumns.filter((c) => c.id !== col.id);
    const target = remaining[0];
    tasksForColumn(col.id).forEach((t) => {
      dispatch(moveTaskToColumn({ taskId: t.id, columnId: target.id }));
    });
    dispatch(deleteColumn({ projectId, columnId: col.id }));
  };

  const moveColumn = (col, direction) => {
    if (!canEdit) return;
    const idx = sortedColumns.findIndex((c) => c.id === col.id);
    const swapWith = sortedColumns[idx + direction];
    if (!swapWith) return;
    const newOrder = [...sortedColumns];
    [newOrder[idx], newOrder[idx + direction]] = [newOrder[idx + direction], newOrder[idx]];
    dispatch(reorderColumns({ projectId, newOrder: newOrder.map((c) => c.id) }));
  };

  return (
    <div className="kanban-board">
      {sortedColumns.map((col, idx) => {
        const colTasks = tasksForColumn(col.id);
        const mappedStatus = COLUMN_STATUS_MAP[col.id];
        // Show lock hint generally for non-admins, though assignees can still move their own tasks
        const locked = mappedStatus && !canEdit;

        return (
          <div
            key={col.id}
            className={`kanban-column ${dragOverColId === col.id ? 'kanban-column-dragover' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColId(col.id);
            }}
            onDragLeave={() => setDragOverColId((id) => (id === col.id ? null : id))}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="kanban-column-header">
              {canEdit && (
                <button type="button" className="kanban-col-arrow" disabled={idx === 0} onClick={() => moveColumn(col, -1)} title="Move left">
                  <ChevronLeft />
                </button>
              )}

              {editingColId === col.id ? (
                <input
                  autoFocus
                  className="kanban-column-title-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingColId(null);
                  }}
                />
              ) : (
                <h4 className="kanban-column-title" onClick={() => startRename(col)} title={canEdit ? 'Click to rename' : undefined}>
                  {col.name}
                  {locked && <span className="kanban-locked-hint" title="Only the assignee or an admin can move tasks here"> 🔒</span>}
                </h4>
              )}

              <span className="kanban-column-count">{colTasks.length}</span>

              {canEdit && (
                <button type="button" className="kanban-col-arrow" disabled={idx === sortedColumns.length - 1} onClick={() => moveColumn(col, 1)} title="Move right">
                  <ChevronRight />
                </button>
              )}

              {canEdit && sortedColumns.length > 1 && (
                <button type="button" className="kanban-col-delete" onClick={() => handleDeleteColumn(col)} title="Delete column">
                  <X />
                </button>
              )}
            </div>

            <div className="kanban-column-body">
              {colTasks.map((task) => {
                const assignee = allUsers.find((u) => u.id === task.assigneeId);
                const atRisk = isTaskAtRisk(task.dueDate, task.status);
                const dueInfo = getDueDateInfo(task.dueDate, task.status === 'done');
                
                // Calculate drag permission per card
                const canDrag = canEdit || canSetStatus(currentUser, task.status, task);

                return (
                  <div
                    key={task.id}
                    className={`kanban-card ${atRisk ? 'kanban-card-at-risk' : ''}`}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => onTaskClick(task.id)}
                  >
                    <p className="kanban-card-title">{task.title}</p>
                    <div className="kanban-card-meta">
                      <span className={`priority-dot ${PRIORITY_CLASS[task.priority]}`} title={task.priority} />
                      {task.dueDate && (
                        <span className={`kanban-card-due ${dueInfo?.tone === 'overdue' ? 'task-due-overdue' : ''}`}>
                          <Calendar />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.subtasks?.length > 0 && (
                        <span className="kanban-card-subtasks">
                          <CheckSquare />
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </span>
                      )}
                      {assignee && (
                        <div className="avatar-sm kanban-card-avatar" title={`${assignee.firstName} ${assignee.lastName}`}>
                          {assignee.firstName[0]}{assignee.lastName[0]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && <p className="kanban-empty-hint">Drop a task here</p>}
            </div>
          </div>
        );
      })}

      {canEdit && (
        <div className="kanban-column kanban-add-column">
          {addingColumn ? (
            <div className="kanban-add-column-form">
              <input
                autoFocus
                className="auth-input"
                placeholder="Column name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn();
                  if (e.key === 'Escape') setAddingColumn(false);
                }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAddColumn}>Add</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingColumn(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" className="kanban-add-column-btn" onClick={() => setAddingColumn(true)}>
              <Plus />
              Add column
            </button>
          )}
        </div>
      )}
    </div>
  );
}