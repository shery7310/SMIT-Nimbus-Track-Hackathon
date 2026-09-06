import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, Paperclip, Download } from 'lucide-react';
import {
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addAttachment,
  removeAttachment,
  convertSubtaskToTask,
} from '../../store/tasksSlice';
import SubtaskList from './SubtaskList';
import TaskActivityFeed from './TaskActivityFeed';
import TaskComments from './TaskComments';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatFileSize, readFilesAsAttachments } from '../../utils/fileUtils';
import { canEditTask, canSetStatus, canDeleteTask } from '../../utils/permissions';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', class: 'badge-todo' },
  { value: 'in-progress', label: 'In Progress', class: 'badge-in-progress' },
  { value: 'done', label: 'Done', class: 'badge-done' },
  { value: 'blocked', label: 'Blocked', class: 'badge-blocked' },
];

export default function TaskDetailModal({ taskId, onClose, projectMembers, focusedCommentId = null }) {
  const dispatch = useDispatch();
  const task = useSelector((state) => state.tasks.tasks.find((t) => t.id === taskId));
  const currentUser = useSelector((state) => state.auth.user);
  const canEdit = canEditTask(currentUser);
  const canApprove = canSetStatus(currentUser, 'done');

  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(focusedCommentId);

  if (!task) return null;

  const handleStatusChange = (status) => {
    if (!canSetStatus(currentUser, status)) return;
    dispatch(updateTask({ id: task.id, changes: { status } }));
  };

  const handlePriorityChange = (priority) => {
    if (!canEdit) return;
    dispatch(updateTask({ id: task.id, changes: { priority } }));
  };

  const handleAssigneeChange = (assigneeId) => {
    if (!canEdit) return;
    dispatch(updateTask({ id: task.id, changes: { assigneeId: assigneeId || null } }));
  };

  const handleDueDateChange = (dueDate) => {
    if (!canEdit) return;
    dispatch(updateTask({ id: task.id, changes: { dueDate: dueDate || null } }));
  };

  const handleAddLabel = (e) => {
    if (!canEdit) return;
    if (e.key === 'Enter' && newLabel.trim()) {
      if (!task.labels.includes(newLabel.trim())) {
        dispatch(updateTask({ id: task.id, changes: { labels: [...task.labels, newLabel.trim()] } }));
      }
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label) => {
    if (!canEdit) return;
    dispatch(updateTask({ id: task.id, changes: { labels: task.labels.filter((l) => l !== label) } }));
  };

  const handleAddSubtask = () => {
    if (!canEdit) return;
    if (!newSubtask.trim()) return;
    dispatch(addSubtask({ taskId: task.id, title: newSubtask }));
    setNewSubtask('');
  };

  const handleConvertSubtask = (subtaskId) => {
    if (!canEdit) return;
    dispatch(convertSubtaskToTask({ taskId: task.id, subtaskId }));
  };

  const handleFilesSelected = (e) => {
    if (!canEdit) return;
    setAttachmentError('');
    readFilesAsAttachments(e.target.files, {
      onAttachment: (att) => dispatch(addAttachment({ taskId: task.id, attachment: att })),
      onError: setAttachmentError,
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    if (!canEdit) return;
    dispatch(removeAttachment({ taskId: task.id, attachmentId }));
  };

  const handleConfirmDelete = () => {
    dispatch(deleteTask(task.id));
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task Details</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          {!canEdit && (
            <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 10 }}>
              Viewing as {currentUser?.role || 'Viewer'} - read-only access.
            </p>
          )}

          {/* Title */}
          <div className="modal-field">
            <label>Title</label>
            <input
              type="text"
              value={task.title}
              readOnly={!canEdit}
              onChange={(e) => dispatch(updateTask({ id: task.id, changes: { title: e.target.value } }))}
            />
          </div>

          {/* Description */}
          <div className="modal-field">
            <label>Description</label>
            <textarea
              value={task.description}
              readOnly={!canEdit}
              onChange={(e) => dispatch(updateTask({ id: task.id, changes: { description: e.target.value } }))}
              placeholder="Add a more detailed description..."
            />
          </div>

          {/* Status */}
          <div className="modal-field">
            <label>Status</label>
            <div className="status-selector">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`status-option ${task.status === opt.value ? 'active' : ''}`}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={!canSetStatus(currentUser, opt.value)}
                >
                  <span className={`badge ${opt.class}`}>{opt.label}</span>
                </button>
              ))}
            </div>
            {!canApprove && (
              <p style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>
                Admin approval required to mark as Done or Blocked.
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="modal-field">
            <label>Priority</label>
            <select
              value={task.priority}
              disabled={!canEdit}
              onChange={(e) => handlePriorityChange(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="modal-field">
            <label>Assignee</label>
            <select
              value={task.assigneeId || ''}
              disabled={!canEdit}
              onChange={(e) => handleAssigneeChange(e.target.value)}
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="modal-field">
            <label>Due Date</label>
            <input
              type="date"
              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
              disabled={!canEdit}
              onChange={(e) => handleDueDateChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>

          {/* Labels */}
          <div className="modal-field">
            <label>Labels</label>
            <div className="label-tags-container">
              {(task.labels || []).map((label) => (
                <span key={label} className="label-tag">
                  {label}
                  {canEdit && (
                    <button type="button" onClick={() => handleRemoveLabel(label)}>
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {canEdit && (
              <input
                type="text"
                placeholder="Type a label and press Enter..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleAddLabel}
                style={{ marginTop: 6 }}
              />
            )}
          </div>

          {/* Subtasks */}
          <div className="task-detail-section">
            <h4>Subtasks</h4>
            <SubtaskList
              subtasks={task.subtasks || []}
              canEdit={canEdit}
              onToggle={(subtaskId) => dispatch(toggleSubtask({ taskId: task.id, subtaskId }))}
              onDelete={(subtaskId) => dispatch(deleteSubtask({ taskId: task.id, subtaskId }))}
              onConvert={handleConvertSubtask}
            />

            {canEdit && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input
                  className="auth-input"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAddSubtask}>
                  <Plus />
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="task-detail-section">
            <h4>Attachments</h4>
            {(task.attachments || []).length > 0 && (
              <div className="subtask-list" style={{ marginBottom: 8 }}>
                {(task.attachments || []).map((att) => (
                  <div key={att.id} className="subtask-item">
                    <Paperclip style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--ink-400)' }} />
                    <span className="subtask-title" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {att.name}
                      <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{formatFileSize(att.size)}</span>
                    </span>
                    <div className="subtask-actions">
                      <a className="subtask-action-btn" title="Download" href={att.dataUrl} download={att.name}>
                        <Download />
                      </a>
                      {canEdit && (
                        <button
                          type="button"
                          className="subtask-action-btn"
                          title="Remove"
                          onClick={() => handleRemoveAttachment(att.id)}
                        >
                          <Trash2 />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <Paperclip />
                Attach file
                <input type="file" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
              </label>
            )}
            {attachmentError && (
              <p style={{ fontSize: 12, color: 'var(--accent-red, #e5484d)', marginTop: 6 }}>{attachmentError}</p>
            )}
          </div>

          {/* Comments */}
          <div className="task-detail-section">
            <h4>Comments</h4>
            <TaskComments
              task={task}
              projectMembers={projectMembers}
              currentUser={currentUser}
              focusedCommentId={activeCommentId}
            />
          </div>

          {/* Activity */}
          <div className="task-detail-section">
            <h4>Activity</h4>
            <TaskActivityFeed
              taskId={task.id}
              onCommentClick={(commentId) => setActiveCommentId(commentId)}
            />
          </div>
        </div>

        <div className="modal-footer">
          {canDeleteTask(currentUser) && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 />
              Delete Task
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task?"
        message={`Are you sure you want to delete "${task.title}"? This can be undone from the toast notification.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}