import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, X, Users } from 'lucide-react';
import { assignMember, removeMember } from '../../store/projectsSlice';

export default function ProjectMembers({ projectId }) {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');

  const project = useSelector((state) => state.projects.projects.find((p) => p.id === projectId));
  const workspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.id === project?.workspaceId)
  );
  const allUsers = useSelector((state) => state.auth.users);

  if (!project) return null;

  const workspaceMembers = allUsers.filter((u) => workspace?.memberIds.includes(u.id));
  const projectMembers = allUsers.filter((u) => project.memberIds.includes(u.id));
  const eligibleToAdd = workspaceMembers.filter((u) => !project.memberIds.includes(u.id));

  const handleAdd = () => {
    if (!inviteUserId) return;
    dispatch(assignMember({ projectId: project.id, userId: inviteUserId }));
    setInviteUserId('');
  };

  const handleRemove = (userId) => {
    dispatch(removeMember({ projectId: project.id, userId }));
  };

  return (
    <div className="pm-section ws-settings-section">
      <button type="button" className="pm-toggle" onClick={() => setExpanded((v) => !v)}>
        <h3 className="pm-toggle-title ws-settings-section-title">
          <Users style={{ width: 16, height: 16 }} />
          Project Members ({projectMembers.length})
        </h3>
        <span className="pm-toggle-action">{expanded ? 'Close' : 'Manage'}</span>
      </button>

      {!expanded && projectMembers.length > 0 && (
        <div className="pm-avatar-row">
          {projectMembers.map((m) => (
            <div
              key={m.id}
              className="avatar-sm pm-avatar"
              title={`${m.firstName} ${m.lastName}`}
            >
              {m.firstName[0]}
              {m.lastName[0]}
            </div>
          ))}
        </div>
      )}

      {!expanded && projectMembers.length === 0 && (
        <p className="pm-empty">No members on this project yet — click Manage to add some.</p>
      )}

      {expanded && (
        <>
          <div className="ws-member-list pm-member-list">
            {projectMembers.map((m) => (
              <div key={m.id} className="ws-member-row">
                <div className="avatar-sm pm-avatar">
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
                  onClick={() => handleRemove(m.id)}
                  className="topbar-icon-btn"
                  title="Remove from project"
                >
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
            {projectMembers.length === 0 && (
              <p className="pm-empty">No members on this project yet.</p>
            )}
          </div>

          {eligibleToAdd.length > 0 ? (
            <div className="ws-invite-row">
              <select
                className="auth-input"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
              >
                <option value="">Select a workspace member...</option>
                {eligibleToAdd.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={!inviteUserId}>
                <UserPlus />
                Add
              </button>
            </div>
          ) : (
            <p className="pm-note">Every workspace member is already on this project. Invite more people to the workspace first.</p>
          )}
        </>
      )}
    </div>
  );
}