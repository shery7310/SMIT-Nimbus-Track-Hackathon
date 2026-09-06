import { NavLink, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  LayoutGrid,
  Settings,
  Hash,
  Plus,
  SlidersHorizontal,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import CreateProjectModal from '../project/CreateProjectModal';
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher';

export default function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { workspaceId, projectId } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const projects = useSelector(
    (state) =>
      state.projects?.projects.filter((p) => p.workspaceId === workspaceId && p.status === 'active') || []
  );

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <WorkspaceSwitcher />
        </div>

        {workspaceId && (
          <nav className="sidebar-nav">
            <div className="sidebar-projects-header">
              <NavLink
                to={`/workspace/${workspaceId}`}
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
                title="Projects"
                style={{ flex: 1 }}
              >
                <LayoutGrid />
                <span>Projects</span>
              </NavLink>
              {projects.length > 0 && (
                <button
                  type="button"
                  className={`sidebar-projects-toggle ${projectsExpanded ? 'expanded' : ''}`}
                  onClick={() => setProjectsExpanded((v) => !v)}
                  title={projectsExpanded ? 'Collapse project list' : 'Expand project list'}
                  aria-label="Toggle project list"
                >
                  <ChevronDown size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="sidebar-create-btn"
              onClick={() => setShowCreateModal(true)}
              title="New Project"
            >
              <Plus />
              <span>New Project</span>
            </button>

            {projectsExpanded && projects.length > 0 && (
              <div className="sidebar-projects-list">
                {projects.map((project) => (
                  <NavLink
                    key={project.id}
                    to={`/workspace/${workspaceId}/project/${project.id}`}
                    className={({ isActive }) => `sidebar-link sidebar-project-link ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                    title={project.name}
                  >
                    <Hash size={14} style={{ color: project.color, flexShrink: 0 }} />
                    <span className="sidebar-project-name">{project.name}</span>
                  </NavLink>
                ))}
              </div>
            )}

            {projectId && (
              <NavLink
                to={`/workspace/${workspaceId}/project/${projectId}/settings`}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
                title="Project Settings"
              >
                <SlidersHorizontal size={18} />
                <span>Project Settings</span>
              </NavLink>
            )}

            <NavLink
              to={`/workspace/${workspaceId}/settings`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="Workspace Settings"
            >
              <Settings />
              <span>Workspace Settings</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              title="App Settings"
            >
              <Sliders size={18} />
              <span>App Settings</span>
            </NavLink>
          </nav>
        )}

        {showCreateModal && (
          <CreateProjectModal workspaceId={workspaceId} onClose={() => setShowCreateModal(false)} />
        )}
      </aside>
    </>
  );
}
