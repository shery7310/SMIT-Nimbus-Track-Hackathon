import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { Calendar, AlertTriangle, Settings } from 'lucide-react';
import { WorkspaceIcon, WORKSPACE_ICON_NAMES } from '../workspace/workspaceIcons';
import { WORKSPACE_COLORS } from '../../store/workspacesSlice';
import { getDueDateInfo, isTaskAtRisk } from '../../utils/dateUtils';
import { updateProjectSettings } from '../../store/projectsSlice';
import { canEditProject, canEditTask } from '../../utils/permissions';
import TaskList from '../task/TaskList';
import KanbanBoard from '../task/KanbanBoard';
import CalendarView from '../task/CalendarView';
import ViewSwitcher from '../task/ViewSwitcher';
import CreateTaskModal from '../task/CreateTaskModal';
import TaskDetailModal from '../task/TaskDetailModal';
import ProjectMembers from './ProjectMembers';
import ProjectActivityFeed from './ProjectActivityFeed';

export default function ProjectHome() {
  const { workspaceId, projectId } = useParams();
  const dispatch = useDispatch();
  
  const project = useSelector((state) =>
    state.projects.projects.find((p) => p.id === projectId)
  );
  const workspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.id === workspaceId)
  );
  const tasks = useSelector((state) =>
    state.tasks.tasks.filter((t) => t.projectId === projectId)
  );
  const allUsers = useSelector((state) => state.auth.users);
  const currentUser = useSelector((state) => state.auth.user);
  
  const atRiskCount = useSelector((state) =>
    state.tasks.tasks.filter(
      (t) => t.projectId === projectId && isTaskAtRisk(t.dueDate, t.status)
    ).length
  );

  const projectMembers = allUsers.filter((u) => project?.memberIds.includes(u.id));

  // Permission checks
  const canEditProjectSettings = canEditProject(currentUser);
  const canCreateTask = canEditTask(currentUser);

  const [view, setView] = useState('list');
  const [showCreate, setShowCreate] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [focusedCommentId, setFocusedCommentId] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [showAppearancePicker, setShowAppearancePicker] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const appearanceRef = useRef(null);

  useEffect(() => {
    if (!showAppearancePicker) return;
    const onClickOutside = (e) => {
      if (appearanceRef.current && !appearanceRef.current.contains(e.target)) {
        setShowAppearancePicker(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showAppearancePicker]);

  useEffect(() => {
    if (project?.defaultView) setView(project.defaultView);
  }, [project?.id]);

  if (!project) {
    return (
      <div className="empty-state">
        <h3>Project not found</h3>
      </div>
    );
  }

  const dueInfo = getDueDateInfo(project.dueDate);

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== project.name) {
      dispatch(updateProjectSettings({ id: project.id, changes: { name: trimmed } }));
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') setEditingName(false);
  };

  const handleSaveDescription = () => {
    dispatch(updateProjectSettings({ id: project.id, changes: { description: descriptionDraft.trim() } }));
    setEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Escape') setEditingDescription(false);
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveDescription();
  };

  const handleIconChange = (iconName) => {
    dispatch(updateProjectSettings({ id: project.id, changes: { icon: iconName } }));
  };

  const handleColorChange = (c) => {
    dispatch(updateProjectSettings({ id: project.id, changes: { color: c } }));
  };

  const handleDueDateChange = (e) => {
    const value = e.target.value;
    dispatch(
      updateProjectSettings({
        id: project.id,
        changes: { dueDate: value ? new Date(value).toISOString() : null },
      })
    );
    setEditingDueDate(false);
  };

  const handleViewChange = (newView) => {
    setView(newView);
    dispatch(updateProjectSettings({ id: project.id, changes: { defaultView: newView } }));
  };

  return (
    <div>
      <div className="project-detail-header">
        <div className="project-detail-top">
          <div style={{ position: 'relative' }} ref={appearanceRef}>
            <button
              type="button"
              className="project-detail-icon"
              style={{ 
                background: project.color, 
                cursor: canEditProjectSettings ? 'pointer' : 'default', 
                opacity: canEditProjectSettings ? 1 : 0.6 
              }}
              onClick={() => canEditProjectSettings && setShowAppearancePicker((v) => !v)}
              title={canEditProjectSettings ? "Click to change icon or color" : "Only Admins can change appearance"}
              disabled={!canEditProjectSettings}
            >
              <WorkspaceIcon name={project.icon} />
            </button>

            {showAppearancePicker && (
              <div className="appearance-popover">
                <div className="pm-popover-label">Icon</div>
                <div className="ws-icon-grid" style={{ marginBottom: 14 }}>
                  {WORKSPACE_ICON_NAMES.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      className={`ws-icon-btn ${project.icon === iconName ? 'selected' : ''}`}
                      onClick={() => handleIconChange(iconName)}
                    >
                      <WorkspaceIcon name={iconName} />
                    </button>
                  ))}
                </div>
                <div className="pm-popover-label">Color</div>
                <div className="ws-swatch-row">
                  {WORKSPACE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`ws-swatch ${project.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => handleColorChange(c)}
                      aria-label={`Choose color ${c}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {editingName ? (
              <input
                type="text"
                className="auth-input"
                value={nameDraft}
                autoFocus
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                style={{ fontSize: 20, fontWeight: 600, padding: '4px 8px', height: 'auto', maxWidth: 400 }}
              />
            ) : (
              <h1
                onClick={() => canEditProjectSettings && (setNameDraft(project.name), setEditingName(true))}
                title={canEditProjectSettings ? "Click to rename project" : "Only Admins can rename"}
                style={{ cursor: canEditProjectSettings ? 'pointer' : 'default', display: 'inline-block', opacity: canEditProjectSettings ? 1 : 0.8 }}
              >
                {project.name}
              </h1>
            )}

            {editingDescription ? (
              <textarea
                className="auth-input"
                rows={2}
                autoFocus
                placeholder="What is this project about?"
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                onBlur={handleSaveDescription}
                onKeyDown={handleDescriptionKeyDown}
                style={{ display: 'block', marginTop: 4, maxWidth: 480 }}
              />
            ) : (
              <p
                onClick={() => canEditProjectSettings && (setDescriptionDraft(project.description || ''), setEditingDescription(true))}
                title={canEditProjectSettings ? "Click to edit description" : "Only Admins can edit description"}
                style={{ cursor: canEditProjectSettings ? 'pointer' : 'default', opacity: canEditProjectSettings ? 1 : 0.8 }}
              >
                {project.description || 'No description — click to add one'}
              </p>
            )}

            {editingDueDate ? (
              <input
                type="date"
                className="auth-input"
                autoFocus
                defaultValue={project.dueDate ? project.dueDate.split('T')[0] : ''}
                onChange={handleDueDateChange}
                onBlur={() => setEditingDueDate(false)}
                style={{ width: 160, marginTop: 6 }}
              />
            ) : (
              <button
                type="button"
                onClick={() => canEditProjectSettings && setEditingDueDate(true)}
                title={canEditProjectSettings ? "Click to change due date" : "Only Admins can change due date"}
                disabled={!canEditProjectSettings}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: canEditProjectSettings ? 'pointer' : 'default',
                  padding: 0,
                  font: 'inherit',
                  opacity: canEditProjectSettings ? 1 : 0.6,
                }}
              >
                {dueInfo ? (
                  <span className={`project-due project-due-${dueInfo.tone}`}>
                    <Calendar />
                    {dueInfo.label}
                  </span>
                ) : (
                  <span className="project-due">
                    <Calendar />
                    Set due date
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="project-detail-meta">
          <Link to={`/workspace/${workspaceId}`}>
            ← Back to {workspace?.name}
          </Link>
          <Link to={`/workspace/${workspaceId}/project/${projectId}/settings`} className="project-settings-link">
            <Settings style={{ width: 14, height: 14 }} />
            Archive, delete & more
          </Link>
        </div>
      </div>

      {atRiskCount > 0 && (
        <div className="project-risk-banner">
          <AlertTriangle />
          {atRiskCount} task{atRiskCount !== 1 ? 's' : ''} still pending and due soon or overdue.
        </div>
      )}

      <ProjectMembers projectId={projectId} />

      <ProjectActivityFeed
        projectId={projectId}
        onCommentClick={(taskId, commentId) => {
          setFocusedCommentId(commentId);
          setDetailTaskId(taskId);
        }}
      />

      <div className="view-switcher-row">
        <ViewSwitcher view={view} onChange={handleViewChange} />
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={() => setShowCreate(true)} 
          disabled={!canCreateTask}
          title={!canCreateTask ? "Only Admins can create tasks" : undefined}
          style={{ opacity: canCreateTask ? 1 : 0.6, cursor: canCreateTask ? 'pointer' : 'not-allowed' }}
        >
          + Create Task
        </button>
      </div>

      {view === 'list' && (
        <TaskList
          projectId={projectId}
          workspaceId={workspaceId}
          onTaskClick={(id) => setDetailTaskId(id)}
        />
      )}

      {view === 'board' && (
        <KanbanBoard
          projectId={projectId}
          columns={project.columns || []}
          tasks={tasks}
          onTaskClick={(id) => setDetailTaskId(id)}
        />
      )}

      {view === 'calendar' && (
        <CalendarView
          tasks={tasks}
          onTaskClick={(id) => setDetailTaskId(id)}
        />
      )}

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          workspaceId={workspaceId}
          projectMembers={projectMembers}
          onClose={() => setShowCreate(false)}
        />
      )}

      {detailTaskId && (
        <TaskDetailModal
          taskId={detailTaskId}
          onClose={() => {
            setDetailTaskId(null);
            setFocusedCommentId(null);
          }}
          projectMembers={projectMembers}
          focusedCommentId={focusedCommentId}
        />
      )}
    </div>
  );
}