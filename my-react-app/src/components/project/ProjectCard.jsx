import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, AlertTriangle } from 'lucide-react';
import { WorkspaceIcon } from '../workspace/workspaceIcons';
import { getDueDateInfo, isTaskAtRisk } from '../../utils/dateUtils';

export default function ProjectCard({ project, members }) {
  const activeMembers = members.filter((m) => project.memberIds.includes(m.id));
  const dueInfo = getDueDateInfo(project.dueDate);

  const atRiskCount = useSelector((state) =>
    state.tasks.tasks.filter(
      (t) => t.projectId === project.id && isTaskAtRisk(t.dueDate, t.status)
    ).length
  );

  return (
    <Link
      to={`/workspace/${project.workspaceId}/project/${project.id}`}
      className={`project-card ${project.status === 'archived' ? 'project-card-archived' : ''}`}
    >
      <div className="project-card-stripe" style={{ background: project.color }} />

      <div className="project-card-header">
        <div className="project-card-icon" style={{ background: project.color }}>
          <WorkspaceIcon name={project.icon} />
        </div>
        <h3 className="project-card-name">{project.name}</h3>
        {atRiskCount > 0 && (
          <span className="project-warning-badge" title={`${atRiskCount} task${atRiskCount !== 1 ? 's' : ''} due soon or overdue`}>
            <AlertTriangle />
            {atRiskCount}
          </span>
        )}
      </div>

      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}

      <div className="project-card-footer">
        <span className="project-card-meta">
          {project.status === 'archived'
            ? 'Archived'
            : `${activeMembers.length} member${activeMembers.length !== 1 ? 's' : ''}`}
        </span>
        {dueInfo && (
          <span className={`project-due project-due-${dueInfo.tone}`}>
            <Calendar />
            {dueInfo.label}
          </span>
        )}
        <div className="project-card-members">
          {activeMembers.slice(0, 3).map((m) => (
            <div key={m.id} className="avatar-sm" style={{ background: project.color }}>
              {m.firstName[0]}{m.lastName[0]}
            </div>
          ))}
          {activeMembers.length > 3 && (
            <div className="avatar-sm" style={{ background: 'var(--ink-400)' }}>
              +{activeMembers.length - 3}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}