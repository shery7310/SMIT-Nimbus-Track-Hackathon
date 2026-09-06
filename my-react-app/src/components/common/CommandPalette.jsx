import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Plus,
  Moon,
  Sun,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Sliders,
  HelpCircle,
  FolderKanban,
  Building2,
  CheckSquare,
} from 'lucide-react';
import { toggleTheme, setSyncing, updateLastSyncedAt } from '../../store/settingsSlice';
import { performUndo, performRedo } from '../../store/undoRedoSlice';
import { addToast } from '../../store/toastSlice';

export default function CommandPalette({ isOpen, onClose, onOpenCreateTask, onOpenShortcuts }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const workspaces = useSelector((state) => state.workspaces?.workspaces || []);
  const activeWorkspaceId = useSelector((state) => state.workspaces?.activeWorkspaceId);
  const projects = useSelector((state) => state.projects?.projects || []);
  const tasks = useSelector((state) => state.tasks?.tasks || []);
  const theme = useSelector((state) => state.settings?.theme || 'light');
  const canUndo = useSelector((state) => (state.undoRedo?.past || []).length > 0);
  const canRedo = useSelector((state) => (state.undoRedo?.future || []).length > 0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build commands list
  const actions = [
    {
      id: 'create-task',
      category: 'Actions',
      title: 'Create New Task',
      subtitle: 'Shortcut: C',
      icon: Plus,
      action: () => {
        onClose();
        onOpenCreateTask?.();
      },
    },
    {
      id: 'toggle-theme',
      category: 'Preferences',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: `Current: ${theme}`,
      icon: theme === 'dark' ? Sun : Moon,
      action: () => {
        dispatch(toggleTheme());
        onClose();
      },
    },
    {
      id: 'undo',
      category: 'History',
      title: 'Undo last action',
      subtitle: canUndo ? 'Cmd/Ctrl + Z' : 'Nothing to undo',
      icon: RotateCcw,
      disabled: !canUndo,
      action: () => {
        if (canUndo) dispatch(performUndo());
        onClose();
      },
    },
    {
      id: 'redo',
      category: 'History',
      title: 'Redo last action',
      subtitle: canRedo ? 'Cmd/Ctrl + Y' : 'Nothing to redo',
      icon: RotateCw,
      disabled: !canRedo,
      action: () => {
        if (canRedo) dispatch(performRedo());
        onClose();
      },
    },
    {
      id: 'sync',
      category: 'Actions',
      title: 'Sync offline data',
      subtitle: 'Reconcile changes with server',
      icon: RefreshCw,
      action: () => {
        dispatch(setSyncing(true));
        setTimeout(() => {
          dispatch(setSyncing(false));
          dispatch(updateLastSyncedAt());
          dispatch(addToast({ message: 'All workspace changes synchronized successfully!', type: 'success' }));
        }, 700);
        onClose();
      },
    },
    {
      id: 'settings',
      category: 'Navigation',
      title: 'App Settings & Preferences',
      subtitle: 'Theme, default views, data persistence',
      icon: Sliders,
      action: () => {
        navigate('/settings');
        onClose();
      },
    },
    {
      id: 'shortcuts',
      category: 'Help',
      title: 'Keyboard Shortcuts Help',
      subtitle: 'Shortcut: ?',
      icon: HelpCircle,
      action: () => {
        onClose();
        onOpenShortcuts?.();
      },
    },
  ];

  // Workspaces navigation
  const workspaceItems = workspaces.map((w) => ({
    id: `ws-${w.id}`,
    category: 'Workspaces',
    title: `Go to ${w.name}`,
    subtitle: `${w.memberIds?.length || 0} members`,
    icon: Building2,
    action: () => {
      navigate(`/workspace/${w.id}`);
      onClose();
    },
  }));

  // Projects navigation
  const projectItems = projects.map((p) => ({
    id: `proj-${p.id}`,
    category: 'Projects',
    title: p.name,
    subtitle: p.description || 'Project',
    icon: FolderKanban,
    action: () => {
      navigate(`/workspace/${p.workspaceId}/project/${p.id}`);
      onClose();
    },
  }));

  // Tasks navigation
  const taskItems = tasks.slice(0, 30).map((t) => ({
    id: `task-${t.id}`,
    category: 'Tasks',
    title: t.title,
    subtitle: `Status: ${t.status} | Priority: ${t.priority}`,
    icon: CheckSquare,
    action: () => {
      navigate(`/workspace/${t.workspaceId}/project/${t.projectId}`);
      onClose();
    },
  }));

  const allItems = [...actions, ...workspaceItems, ...projectItems, ...taskItems];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : actions;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-row">
          <Search className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command or search (projects, tasks, workspaces)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="palette-kbd">Esc</kbd>
        </div>

        <div className="palette-results" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="palette-empty">No commands or items found for "{query}"</div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`palette-item ${isSelected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`}
                  onClick={() => !item.disabled && item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <Icon className="palette-item-icon" />
                  <div className="palette-item-info">
                    <span className="palette-item-title">{item.title}</span>
                    {item.subtitle && <span className="palette-item-sub">{item.subtitle}</span>}
                  </div>
                  <span className="palette-item-tag">{item.category}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="palette-footer">
          <span>
            Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select
          </span>
          <span>Workspace Manager</span>
        </div>
      </div>
    </div>
  );
}
