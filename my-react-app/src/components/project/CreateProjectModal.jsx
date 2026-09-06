import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Check } from 'lucide-react';
import { createProject } from '../../store/projectsSlice';
import { createTask } from '../../store/tasksSlice';
import { WORKSPACE_COLORS } from '../../store/workspacesSlice';
import { WORKSPACE_ICON_NAMES, WorkspaceIcon } from '../workspace/workspaceIcons';
import { PROJECT_TEMPLATES } from '../../data/projectTemplates';

export default function CreateProjectModal({ workspaceId, onClose }) {
  const dispatch = useDispatch();
  const workspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.id === workspaceId)
  );
  const allUsers = useSelector((state) => state.auth.users);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Briefcase');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(PROJECT_TEMPLATES[0]);

  const workspaceMembers = allUsers.filter((u) => workspace?.memberIds.includes(u.id));

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProjectId = crypto.randomUUID();

    dispatch(
      createProject({
        id: newProjectId,
        workspaceId,
        name,
        description,
        icon,
        color,
        memberIds: selectedMembers,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
    );

    // Seed tasks from template
    if (selectedTemplate.tasks.length > 0) {
      selectedTemplate.tasks.forEach((task) => {
        dispatch(
          createTask({
            projectId: newProjectId,
            workspaceId,
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            status: task.status || 'todo',
          })
        );
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Project</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Template Picker */}
            <div className="modal-field">
              <label>Template</label>
              <div className="template-picker">
                {PROJECT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`template-card ${selectedTemplate.id === tmpl.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(tmpl)}
                  >
                    <h4>{tmpl.name}</h4>
                    <p>{tmpl.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-field">
              <label>Project name</label>
              <input
                type="text"
                placeholder="e.g. Sprint 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Description</label>
              <textarea
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>Icon</label>
              <div className="ws-icon-grid">
                {WORKSPACE_ICON_NAMES.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    className={`ws-icon-btn ${icon === iconName ? 'selected' : ''}`}
                    onClick={() => setIcon(iconName)}
                  >
                    <WorkspaceIcon name={iconName} />
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-field">
              <label>Color</label>
              <div className="ws-swatch-row">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`ws-swatch ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Choose color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="modal-field">
              <label>Due date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {workspaceMembers.length > 0 && (
              <div className="modal-field">
                <label>Members</label>
                <div className="member-select-list">
                  {workspaceMembers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`member-select-item ${selectedMembers.includes(u.id) ? 'selected' : ''}`}
                      onClick={() => toggleMember(u.id)}
                    >
                      <div className="avatar-sm" style={{ background: color }}>
                        {u.firstName[0]}
                        {u.lastName[0]}
                      </div>
                      <span style={{ flex: 1 }}>
                        {u.firstName} {u.lastName}
                      </span>
                      {selectedMembers.includes(u.id) && (
                        <Check className="member-select-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}