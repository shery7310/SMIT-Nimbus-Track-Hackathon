import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';

export default function ProjectList({ workspaceId }) {
  const [showModal, setShowModal] = useState(false);
  const projects = useSelector((state) =>
    state.projects.projects.filter((p) => p.workspaceId === workspaceId)
  );
  const allUsers = useSelector((state) => state.auth.users);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div>
      <div className="project-toolbar">
        <span className="project-count">
          {activeProjects.length} project{activeProjects.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="project-grid">
        <button type="button" className="project-create-card" onClick={() => setShowModal(true)}>
          <Plus />
          <span>Create Project</span>
        </button>

        {activeProjects.map((project) => (
          <ProjectCard key={project.id} project={project} members={allUsers} />
        ))}
      </div>

      {archivedProjects.length > 0 && (
        <>
          <h3 className="project-archived-heading">Archived</h3>
          <div className="project-grid">
            {archivedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} members={allUsers} />
            ))}
          </div>
        </>
      )}

      {showModal && (
        <CreateProjectModal workspaceId={workspaceId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}