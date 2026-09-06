import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, X, Trash2, Download, Upload, Check } from 'lucide-react';
import { deleteProject } from '../../store/projectsSlice';
import { bulkDelete } from '../../store/tasksSlice';
import {
  updateWorkspaceSettings,
  deleteWorkspace,
  inviteMember,
  removeMember,
  WORKSPACE_COLORS,
} from '../../store/workspacesSlice';
import { WORKSPACE_ICON_NAMES, WorkspaceIcon } from './workspaceIcons';
import { canEditWorkspace, canDeleteWorkspace } from '../../utils/permissions';
import { addToast } from '../../store/toastSlice';
import { exportWorkspaceData, validateWorkspaceJSON } from '../../utils/storageUtils';
import ConfirmDialog from '../common/ConfirmDialog';

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const workspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.id === workspaceId)
  );
  const allUsers = useSelector((state) => state.auth.users);
  const currentUser = useSelector((state) => state.auth.user);
  const projects = useSelector((state) => state.projects.projects);
  const tasks = useSelector((state) => state.tasks.tasks);
  const activity = useSelector((state) => state.activity.entries);

  // Permission checks
  const canEdit = canEditWorkspace(currentUser);
  const canDelete = canDeleteWorkspace(currentUser);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Briefcase');
  const [color, setColor] = useState(WORKSPACE_COLORS[0]);
  const [defaultView, setDefaultView] = useState('list');
  const [inviteUserId, setInviteUserId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setIcon(workspace.icon);
      setColor(workspace.color);
      setDefaultView(workspace.defaultView);
    }
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="empty-state">
        <h3>Workspace not found</h3>
      </div>
    );
  }

  const members = allUsers.filter((u) => workspace.memberIds.includes(u.id));
  const nonMembers = allUsers.filter((u) => !workspace.memberIds.includes(u.id));

  const handleSave = () => {
    if (!canEdit) return;
    dispatch(
      updateWorkspaceSettings({
        id: workspace.id,
        changes: { name: name.trim(), icon, color, defaultView },
      })
    );
    dispatch(addToast({ message: 'Workspace settings saved', type: 'success' }));
  };

  const handleInvite = () => {
    if (!canEdit || !inviteUserId) return;
    dispatch(inviteMember({ workspaceId: workspace.id, userId: inviteUserId }));
    dispatch(addToast({ message: 'Member invited to workspace', type: 'info' }));
    setInviteUserId('');
  };

  const handleExportWorkspace = () => {
    exportWorkspaceData({ workspace, projects, tasks, activity });
    dispatch(addToast({ message: `Exported "${workspace.name}" as JSON`, type: 'success' }));
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = validateWorkspaceJSON(event.target.result);
      if (!result.valid) {
        dispatch(addToast({ message: `Validation error: ${result.error}`, type: 'error' }));
        setImportSummary(null);
      } else {
        setImportSummary(result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importSummary?.data) return;
    const { workspace: importedWs, projects: importedProj, tasks: importedTasks } = importSummary.data;

    try {
      const existingWs = JSON.parse(localStorage.getItem('workspace_manager_workspaces') || '[]');
      const filteredWs = existingWs.filter((w) => w.id !== importedWs.id);
      filteredWs.push(importedWs);
      localStorage.setItem('workspace_manager_workspaces', JSON.stringify(filteredWs));

      const existingProj = JSON.parse(localStorage.getItem('workspace_manager_projects') || '[]');
      const filteredProj = existingProj.filter((p) => p.workspaceId !== importedWs.id);
      localStorage.setItem('workspace_manager_projects', JSON.stringify([...filteredProj, ...importedProj]));

      const existingTasks = JSON.parse(localStorage.getItem('workspace_manager_tasks') || '[]');
      const filteredTasks = existingTasks.filter((t) => t.workspaceId !== importedWs.id);
      localStorage.setItem('workspace_manager_tasks', JSON.stringify([...filteredTasks, ...importedTasks]));

      dispatch(
        addToast({
          message: `Workspace "${importedWs.name}" imported successfully! Refreshing...`,
          type: 'success',
        })
      );
      setImportSummary(null);
      setTimeout(() => {
        window.location.href = `/workspace/${importedWs.id}`;
      }, 700);
    } catch (err) {
      dispatch(addToast({ message: `Import error: ${err.message}`, type: 'error' }));
    }
  };

  const handleConfirmDelete = () => {
    if (!canDelete) return;

    const doomedProjects = projects.filter((p) => p.workspaceId === workspace.id);
    const doomedProjectIds = new Set(doomedProjects.map((p) => p.id));

    dispatch(bulkDelete(tasks.filter((t) => doomedProjectIds.has(t.projectId)).map((t) => t.id)));
    doomedProjects.forEach((p) => dispatch(deleteProject(p.id)));
    dispatch(deleteWorkspace(workspace.id));
    dispatch(addToast({ message: `Workspace "${workspace.name}" was deleted`, type: 'warning' }));
    setShowDeleteConfirm(false);
    navigate('/');
  };

  return (
    <div className="ws-settings-page">
      <h1 className="ws-settings-title">Workspace Settings</h1>

      {/* General */}
      <section className="ws-settings-section">
        <h3 className="ws-settings-section-title">General</h3>

        <div className="ws-settings-group">
          <label>Workspace name</label>
          <input 
            className="auth-input" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
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
          <label>Default view</label>
          <select
            className="auth-input"
            value={defaultView}
            onChange={(e) => setDefaultView(e.target.value)}
            disabled={!canEdit}
            style={{ opacity: canEdit ? 1 : 0.7, cursor: canEdit ? 'pointer' : 'not-allowed' }}
          >
            <option value="list">List</option>
            <option value="board">Board (Kanban)</option>
            <option value="calendar">Calendar</option>
          </select>
        </div>

        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={!canEdit}
          style={{ opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}
        >
          Save Changes
        </button>
        {!canEdit && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-400)' }}>Only Admins and Owners can edit workspace settings.</p>}
      </section>

      {/* Members */}
      {canEdit && (
        <section className="ws-settings-section">
          <h3 className="ws-settings-section-title">Members ({members.length})</h3>

          <div className="ws-member-list">
            {members.map((m) => (
              <div key={m.id} className="ws-member-row">
                <div className="avatar-sm" style={{ background: 'var(--accent-blue)' }}>
                  {m.firstName[0]}
                  {m.lastName[0]}
                </div>
                <div className="ws-member-info">
                  <div className="ws-member-name">
                    {m.firstName} {m.lastName}
                  </div>
                  <div className="ws-member-email">{m.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(removeMember({ workspaceId: workspace.id, userId: m.id }))}
                  className="topbar-icon-btn"
                  title="Remove member"
                >
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
            {members.length === 0 && <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>No members yet.</p>}
          </div>

          {nonMembers.length > 0 && (
            <div className="ws-invite-row">
              <select
                className="auth-input"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
              >
                <option value="">Select a user to invite...</option>
                {nonMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={!inviteUserId}
              >
                <UserPlus />
                Invite
              </button>
            </div>
          )}
        </section>
      )}

      {/* Data Backup & Restore */}
      {canEdit && (
        <section className="ws-settings-section">
          <h3 className="ws-settings-section-title">Data Backup & Restore</h3>
          <p className="ws-danger-text" style={{ color: 'var(--ink-600)' }}>
            Export this workspace's projects and tasks as JSON, or import previously exported data.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={handleExportWorkspace}>
              <Download />
              Export Workspace JSON
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload />
              Import Workspace JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
          </div>

          {importSummary && (
            <div className="import-preview-box" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--accent-blue)' }}>
                <Check style={{ width: 16, height: 16 }} />
                Valid Workspace Backup
              </div>
              <p style={{ margin: '6px 0 10px', fontSize: 13, color: 'var(--ink-600)' }}>
                Workspace: <strong>"{importSummary.summary.workspaceName}"</strong> (
                {importSummary.summary.projectCount} projects, {importSummary.summary.taskCount} tasks)
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmImport}>
                  Confirm & Apply
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImportSummary(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Danger zone */}
      {canDelete && (
        <section className="ws-settings-section danger">
          <h3 className="ws-settings-section-title danger">Danger Zone</h3>
          <p className="ws-danger-text">
            Deleting a workspace removes all of its projects and tasks. This can't be undone.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 />
            Delete Workspace
          </button>
        </section>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete "${workspace.name}"?`}
        message="This will permanently delete this workspace, including all its projects, tasks, and attachments."
        confirmText="Delete Workspace"
        cancelText="Cancel"
        requireInputMatch="DELETE"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}