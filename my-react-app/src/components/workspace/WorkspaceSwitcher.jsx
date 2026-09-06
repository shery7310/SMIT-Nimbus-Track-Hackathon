import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import { createWorkspace, switchWorkspace, WORKSPACE_COLORS } from '../../store/workspacesSlice';
import { WorkspaceIcon } from './workspaceIcons';

export default function WorkspaceSwitcher() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaces, activeWorkspaceId } = useSelector((state) => state.workspaces);
  const { user } = useSelector((state) => state.auth);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0]);
  const wrapRef = useRef(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSwitch = (id) => {
    dispatch(switchWorkspace(id));
    navigate(`/workspace/${id}`);
    setOpen(false);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    dispatch(createWorkspace({ name: newName, color: newColor, ownerId: user?.id }));
    setNewName('');
    setNewColor(WORKSPACE_COLORS[0]);
    setCreating(false);
    setOpen(false);
  };

  return (
    <div className="ws-switcher" ref={wrapRef}>
      <button type="button" className="ws-switcher-trigger" onClick={() => setOpen((o) => !o)}>
        <div className="ws-icon" style={{ background: activeWorkspace?.color || '#6b778c' }}>
          {activeWorkspace ? <WorkspaceIcon name={activeWorkspace.icon} /> : '?'}
        </div>
        <div className="ws-switcher-label">
          <div className="ws-switcher-name">{activeWorkspace?.name || 'No workspace'}</div>
          <div className="ws-switcher-sub">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</div>
        </div>
        <ChevronsUpDown className="ws-switcher-chevron" />
      </button>

      {open && (
        <div className="ws-dropdown">
          <div className="ws-dropdown-list">
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`ws-dropdown-item ${w.id === activeWorkspaceId ? 'active' : ''}`}
                onClick={() => handleSwitch(w.id)}
              >
                <div className="ws-icon" style={{ width: 22, height: 22, background: w.color }}>
                  <WorkspaceIcon name={w.icon} style={{ width: 12, height: 12 }} />
                </div>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.name}
                </span>
                {w.id === activeWorkspaceId && <Check style={{ width: 14, height: 14 }} />}
              </button>
            ))}
            {workspaces.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--ink-400)', padding: '8px' }}>
                No workspaces yet — create your first one below.
              </p>
            )}
          </div>

          {!creating ? (
            <div className="ws-dropdown-footer">
              <button type="button" className="ws-create-btn" onClick={() => setCreating(true)}>
                <Plus style={{ width: 15, height: 15 }} />
                Create workspace
              </button>
            </div>
          ) : (
            <div className="ws-create-form">
              <input
                type="text"
                placeholder="Workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="ws-swatch-row">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`ws-swatch ${newColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                    aria-label={`Choose color ${c}`}
                  />
                ))}
              </div>
              <div className="ws-create-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}