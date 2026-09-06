import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { canEditWorkspace } from '../../utils/permissions';
import ProjectList from '../project/ProjectList';
import { renameWorkspace } from '../../store/workspacesSlice';

export default function WorkspaceHome() {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  
  const workspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.id === workspaceId)
  );
  const currentUser = useSelector((state) => state.auth.user);

  // Permission check: Only Admins and Owners can edit workspace details
  const canEdit = canEditWorkspace(currentUser);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!workspace) return null;

  const handleSaveName = () => {
    if (!canEdit) return; // Safety check
    if (editName.trim() && editName.trim() !== workspace.name) {
      dispatch(renameWorkspace({ id: workspaceId, name: editName.trim() }));
    } else {
      setEditName(workspace.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditName(workspace.name);
      setIsEditing(false);
    }
  };

  return (
    <div>
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={handleKeyDown}
          autoFocus
          className="auth-input"
          style={{
            fontSize: 20,
            fontWeight: 600,
            margin: '0 0 4px',
            padding: '4px 8px',
            height: 'auto',
            width: '100%',
            maxWidth: '400px'
          }}
        />
      ) : (
        <h1 
          onClick={() => canEdit && (setEditName(workspace.name), setIsEditing(true))}
          title={canEdit ? "Click to rename workspace" : "Only Admins and Owners can rename"}
          style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: 'var(--ink-900)', 
            margin: '0 0 4px',
            cursor: canEdit ? 'pointer' : 'default',
            display: 'inline-block',
            opacity: canEdit ? 1 : 0.8
          }}
          onMouseEnter={(e) => canEdit && (e.target.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          {workspace.name}
        </h1>
      )}
      
      <p style={{ fontSize: 13, color: 'var(--ink-400)', margin: '0 0 24px' }}>
        {workspace.memberIds.length} member{workspace.memberIds.length !== 1 ? 's' : ''}
      </p>

      <ProjectList workspaceId={workspaceId} />
    </div>
  );
}