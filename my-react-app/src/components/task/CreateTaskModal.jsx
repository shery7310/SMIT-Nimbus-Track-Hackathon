import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Plus, Trash2, Paperclip } from 'lucide-react';
import { createTask } from '../../store/tasksSlice';
import { formatFileSize, readFilesAsAttachments } from '../../utils/fileUtils';

export default function CreateTaskModal({ projectId, workspaceId, projectMembers = [], onClose }) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [labels, setLabels] = useState([]);
  const [newLabel, setNewLabel] = useState('');

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');

  const handleAddLabel = (e) => {
    if (e.key === 'Enter' && newLabel.trim()) {
      e.preventDefault();
      if (!labels.includes(newLabel.trim())) {
        setLabels([...labels, newLabel.trim()]);
      }
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: crypto.randomUUID(), title: newSubtask.trim(), completed: false, createdAt: new Date().toISOString() },
    ]);
    setNewSubtask('');
  };

  const handleRemoveSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
  };

  const handleFilesSelected = (e) => {
    setAttachmentError('');
    readFilesAsAttachments(e.target.files, {
      onAttachment: (att) => setAttachments((prev) => [...prev, att]),
      onError: setAttachmentError,
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    dispatch(createTask({
      projectId,
      workspaceId,
      title,
      description,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      labels,
      subtasks,
      attachments,
    }));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Task</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label>Title <span className="auth-required">*</span></label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Description</label>
              <textarea
                placeholder="Add details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>Priority</label>
              <div className="priority-selector">
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-option ${priority === p ? 'active' : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    <span className={`priority-dot ${`priority-${p}`}`} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-field">
              <label>Assignee (optional &mdash; you can also assign later)</label>
              <select
                className="auth-input"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Assign later</option>
                {projectMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="modal-field">
              <label>Due Date (optional)</label>
              <input
                type="date"
                className="auth-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Labels */}
            <div className="modal-field">
              <label>Labels (optional)</label>
              <div className="label-input-wrap">
                {labels.map((label) => (
                  <span key={label} className="label-tag">
                    {label}
                    <button type="button" onClick={() => handleRemoveLabel(label)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Type and press Enter..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={handleAddLabel}
                />
              </div>
            </div>

            {/* Subtasks */}
            <div className="modal-field">
              <label>Subtasks (optional)</label>
              {subtasks.length > 0 && (
                <div className="subtask-list" style={{ marginBottom: 8 }}>
                  {subtasks.map((sub) => (
                    <div key={sub.id} className="subtask-item">
                      <span className="subtask-title">{sub.title}</span>
                      <div className="subtask-actions">
                        <button
                          type="button"
                          className="subtask-action-btn"
                          title="Remove"
                          onClick={() => handleRemoveSubtask(sub.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSubtask}>
                  <Plus />
                  Add
                </button>
              </div>
            </div>

            {/* Attachments */}
            <div className="modal-field">
              <label>Attachments (optional)</label>

              {attachments.length > 0 && (
                <div className="subtask-list" style={{ marginBottom: 8 }}>
                  {attachments.map((att) => (
                    <div key={att.id} className="subtask-item">
                      <Paperclip style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--ink-400)' }} />
                      <span className="subtask-title" style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        {att.name}
                        <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>{formatFileSize(att.size)}</span>
                      </span>
                      <div className="subtask-actions">
                        <button
                          type="button"
                          className="subtask-action-btn"
                          title="Remove"
                          onClick={() => handleRemoveAttachment(att.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <Paperclip />
                Attach file
                <input type="file" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
              </label>
              {attachmentError && (
                <p style={{ fontSize: 12, color: 'var(--accent-red, #e5484d)', marginTop: 6 }}>{attachmentError}</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}