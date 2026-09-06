import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trash2, Archive, ArchiveRestore, Check } from 'lucide-react';
import { bulkDelete } from '../../store/tasksSlice';
import {
  updateProjectSettings,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from '../../store/projectsSlice';
import { WORKSPACE_COLORS } from '../../store/workspacesSlice';
import { WORKSPACE_ICON_NAMES, WorkspaceIcon } from '../workspace/workspaceIcons';
import { canEditProject, canDeleteProject } from '../../utils/permissions';
import { addToast } from '../../store/toastSlice';
import ConfirmDialog from '../common/ConfirmDialog';

export default function ProjectSettings() {
  const { workspaceId, projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const project = useSelector((state) =>
    state.projects.projects.find((p) => p.id === projectId)
  );
  const tasks = useSelector((state) => state.tasks.tasks);
  const currentUser = useSelector((state) => state.auth.user);

  // Permission checks
  const canEdit = canEditProject(currentUser);
  const canDelete = canDeleteProject(currentUser);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Briefcase');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [dueDate, setDueDate] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setIcon(project.icon);
      setColor(project.color);
      setDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
    }
  }, [project]);

  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  if (!project) {
    return (
      <div className="empty-state">
        <h3>Project not found</h3>
      </div>
    );
  }

  const handleSave = () => {
    if (!canEdit) return;
    dispatch(
      updateProjectSettings({
        id: project.id,
        changes: {
          name: name.trim(),
          description: description.trim(),
          icon,
          color,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        },
      })
    );
    setJustSaved(true);
    dispatch(addToast({ message: 'Project settings updated', type: 'success' }));
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setJustSaved(false), 2200);
  };

  const handleArchiveToggle = () => {
    if (!canDelete) return;
    if (project.status === 'archived') {
      dispatch(unarchiveProject(project.id));
      dispatch(addToast({ message: `Project "${project.name}" unarchived`, type: 'info' }));
    } else {
      dispatch(archiveProject(project.id));
      dispatch(addToast({ message: `Project "${project.name}" archived`, type: 'info' }));
    }
  };

  const handleConfirmDelete = () => {
    if (!canDelete) return;
    dispatch(bulkDelete(tasks.filter((t) => t.projectId === project.id).map((t) => t.id)));
    dispatch(deleteProject(project.id));
    dispatch(addToast({ message: `Project "${project.name}" deleted`, type: 'warning' }));
    setShowDeleteConfirm(false);
    navigate(`/workspace/${workspaceId}`);
  };

  return (
    <div className="ws-settings-page">
      <Link to={`/workspace/${workspaceId}/project/${projectId}`} className="ws-settings-back-link">
        ← Back to {project.name}
      </Link>

      <h1 className="ws-settings-title">Project Settings</h1>

      <section className="ws-settings-section">
        <h3 className="ws-settings-section-title">General</h3>

        <div className="ws-settings-group">
          <label>Project name</label>
          <input 
            className="auth-input" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'text' : 'not-allowed' }}
          />
        </div>

        <div className="ws-settings-group">
          <label>Description</label>
          <textarea
            className="auth-input"
            rows={3}
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'text' : 'not-allowed' }}
          />
        </div>

        <div className="ws-settings-group">
          <label>Icon</label>
          <div className="ws-icon-grid">
            {WORKSPACE_ICON_NAMES.map((iconName) => (
              <button
                key={iconName}
                type="button"
                className={`ws-icon-btn ${icon === iconName ? 'selected' : ''}`}
                onClick={() => setIcon(iconName)}
                disabled={!canEdit}
                style={{ opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}
              >
                <WorkspaceIcon name={iconName} />
              </button>
            ))}
          </div>
        </div>

        <div className="ws-settings-group">
          <label>Color</label>
          <div className="ws-swatch-row">
            {WORKSPACE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`ws-swatch ${color === c ? 'selected' : ''}`}
                style={{ background: c, opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                onClick={() => setColor(c)}
                disabled={!canEdit}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="ws-settings-group">
          <label>Due date</label>
          <input
            type="date"
            className="auth-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'pointer' : 'not-allowed' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}
          >
            Save Changes
          </button>
          <span className={`ws-save-confirm ${justSaved ? 'visible' : ''}`}>
            <Check style={{ width: 14, height: 14 }} />
            Saved
          </span>
        </div>
        {!canEdit && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-400)' }}>Only Admins and Owners can edit project settings.</p>}
      </section>

      {/* Danger zone - Only visible to Admins/Owners */}
      {canDelete && (
        <section className="ws-settings-section danger">
          <h3 className="ws-settings-section-title danger">Danger Zone</h3>

          <div className="project-danger-actions">
            <button type="button" className="btn btn-secondary" onClick={handleArchiveToggle}>
              {project.status === 'archived' ? <ArchiveRestore /> : <Archive />}
              {project.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 />
              Delete Project
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete "${project.name}"?`}
        message="This will delete this project and all its tasks. This cannot be undone."
        confirmText="Delete Project"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}