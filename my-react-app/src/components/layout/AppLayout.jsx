import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { canCreateTask } from '../../utils/permissions';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from '../common/ToastContainer';
import CommandPalette from '../common/CommandPalette';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import CreateTaskModal from '../task/CreateTaskModal';
import TaskDetailModal from '../task/TaskDetailModal';
import { setOnlineStatus } from '../../store/settingsSlice';
import { performUndo, performRedo } from '../../store/undoRedoSlice';

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [focusedCommentId, setFocusedCommentId] = useState(null);

  const activeWorkspaceId = useSelector((state) => state.workspaces?.activeWorkspaceId);
  const projects = useSelector((state) => state.projects?.projects || []);
  const allUsers = useSelector((state) => state.auth?.users || []);
  const currentUser = useSelector((state) => state.auth?.user);
  const theme = useSelector((state) => state.settings?.theme || 'light');
  
  // Permission check
  const canCreate = canCreateTask(currentUser);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;

      // Cmd/Ctrl + K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + Z -> Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          dispatch(performUndo());
        }
        return;
      }

      // Cmd/Ctrl + Y or Cmd/Ctrl + Shift + Z -> Redo
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          dispatch(performRedo());
        }
        return;
      }

      // Shortcuts when not typing in an input
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '?') {
          e.preventDefault();
          setShortcutsOpen(true);
        } else if (e.key.toLowerCase() === 'c' && canCreate) {
          // Only allow 'C' shortcut for Admins/Owners
          e.preventDefault();
          setQuickCreateOpen(true);
        }
      }
    },
    [dispatch, canCreate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeProject =
    projects.find((p) => location.pathname.includes(`/project/${p.id}`)) ||
    projects.find((p) => p.workspaceId === activeWorkspaceId);

  const projectMembers = activeProject
    ? allUsers.filter((u) => activeProject.memberIds?.includes(u.id))
    : [];

  const handleOpenComment = (taskId, commentId) => {
    setFocusedCommentId(commentId);
    setDetailTaskId(taskId);
  };

  return (
    <div className="shell">
      <Sidebar isMobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="shell-main">
        <Topbar
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
          onOpenComment={handleOpenComment}
        />

        <main className="shell-content">
          <Outlet context={{ onOpenComment: handleOpenComment }} />
        </main>
      </div>

      {/* Global Toast stack */}
      <ToastContainer />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenCreateTask={() => canCreate && setQuickCreateOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Global Shortcuts Cheat Sheet */}
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Quick create task via 'C' shortcut - Only for Admins/Owners */}
      {canCreate && quickCreateOpen && activeProject && (
        <CreateTaskModal
          projectId={activeProject.id}
          workspaceId={activeProject.workspaceId}
          projectMembers={projectMembers}
          onClose={() => setQuickCreateOpen(false)}
        />
      )}

      {/* Detail modal for comment jump */}
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