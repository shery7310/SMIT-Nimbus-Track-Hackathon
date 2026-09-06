import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Sun,
  Moon,
  LayoutGrid,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  setTheme,
  setDefaultViewPreference,
  setSimulateOffline,
  setSimulateNetworkDelay,
  setSimulateNetworkFailure,
  setSyncing,
  updateLastSyncedAt,
} from '../../store/settingsSlice';
import { updatePreference } from '../../store/notificationsSlice';
import { addToast } from '../../store/toastSlice';
import {
  exportWorkspaceData,
  validateWorkspaceJSON,
  resetAllAppData,
} from '../../utils/storageUtils';
import ConfirmDialog from '../common/ConfirmDialog';

export default function AppSettings() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const settings = useSelector((state) => state.settings);
  const notificationPrefs = useSelector(
    (state) => state.notifications?.preferences || { assigned: true, mentioned: true, due_soon: true }
  );
  const workspaces = useSelector((state) => state.workspaces?.workspaces || []);
  const activeWorkspaceId = useSelector((state) => state.workspaces?.activeWorkspaceId);
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const projects = useSelector((state) => state.projects?.projects || []);
  const tasks = useSelector((state) => state.tasks?.tasks || []);
  const activity = useSelector((state) => state.activity?.entries || []);

  const [importSummary, setImportSummary] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSyncNow = () => {
    dispatch(setSyncing(true));
    setTimeout(() => {
      dispatch(setSyncing(false));
      dispatch(updateLastSyncedAt());
      dispatch(
        addToast({
          message: 'All workspace data synchronized successfully with client storage.',
          type: 'success',
        })
      );
    }, 700);
  };

  const handleExport = () => {
    if (!currentWorkspace) {
      dispatch(addToast({ message: 'No workspace available to export.', type: 'warning' }));
      return;
    }
    exportWorkspaceData({
      workspace: currentWorkspace,
      projects,
      tasks,
      activity,
    });
    dispatch(addToast({ message: `Exported workspace "${currentWorkspace.name}" as JSON!`, type: 'success' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = validateWorkspaceJSON(event.target.result);
      if (!result.valid) {
        dispatch(addToast({ message: `Import validation failed: ${result.error}`, type: 'error' }));
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
      // Merge into localStorage
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
          message: `Workspace "${importedWs.name}" imported successfully! Reloading to apply...`,
          type: 'success',
        })
      );

      setImportSummary(null);
      setTimeout(() => {
        window.location.href = `/workspace/${importedWs.id}`;
      }, 800);
    } catch (err) {
      dispatch(addToast({ message: `Failed to import data: ${err.message}`, type: 'error' }));
    }
  };

  const handleResetData = () => {
    resetAllAppData();
    dispatch(
      addToast({
        message: 'All workspace manager state has been wiped. Reloading fresh...',
        type: 'info',
      })
    );
    setTimeout(() => {
      window.location.href = '/';
    }, 600);
  };

  return (
    <div className="ws-settings-page">
      <h1 className="ws-settings-title">Application Settings</h1>

      {/* Theme & Display */}
      <section className="ws-settings-section">
        <h3 className="ws-settings-section-title">
          <Sun style={{ width: 16, height: 16 }} />
          Appearance & Theme
        </h3>
        <p className="ws-settings-desc">Choose your preferred application color scheme (persisted).</p>

        <div className="theme-toggle-row">
          <button
            type="button"
            className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => dispatch(setTheme('light'))}
          >
            <Sun />
            Light Mode
          </button>
          <button
            type="button"
            className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => dispatch(setTheme('dark'))}
          >
            <Moon />
            Dark Mode
          </button>
        </div>

        <div className="ws-settings-group" style={{ marginTop: 18 }}>
          <label>Default Project View</label>
          <select
            className="auth-input"
            value={settings.defaultView || 'list'}
            onChange={(e) => dispatch(setDefaultViewPreference(e.target.value))}
            style={{ maxWidth: 260 }}
          >
            <option value="list">List View</option>
            <option value="board">Kanban Board View</option>
            <option value="calendar">Calendar View</option>
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="ws-settings-section">
        <h3 className="ws-settings-section-title">
          <Bell style={{ width: 16, height: 16 }} />
          Notification Preferences
        </h3>
        <p className="ws-settings-desc">Configure when in-app alerts and notifications trigger.</p>

        <div className="settings-toggle-group">
          <label className="notif-toggle-row">
            <div>
              <strong>Task Assignment</strong>
              <span className="notif-toggle-desc">Trigger notification when assigned to a task</span>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.assigned !== false}
              onChange={(e) => dispatch(updatePreference({ key: 'assigned', value: e.target.checked }))}
            />
          </label>

          <label className="notif-toggle-row">
            <div>
              <strong>Comment @Mentions</strong>
              <span className="notif-toggle-desc">Trigger notification when tagged in task discussions</span>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.mentioned !== false}
              onChange={(e) => dispatch(updatePreference({ key: 'mentioned', value: e.target.checked }))}
            />
          </label>

          <label className="notif-toggle-row">
            <div>
              <strong>Due Date Approaching</strong>
              <span className="notif-toggle-desc">Trigger alerts when a task due date is within 48 hours or overdue</span>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.due_soon !== false}
              onChange={(e) => dispatch(updatePreference({ key: 'due_soon', value: e.target.checked }))}
            />
          </label>
        </div>
      </section>

      {/* Offline & Optimistic UX Simulation Controls */}
      <section className="ws-settings-section">
        <h3 className="ws-settings-section-title">
          <Wifi style={{ width: 16, height: 16 }} />
          Offline & Optimistic Simulation
        </h3>
        <p className="ws-settings-desc">
          Test offline capabilities and optimistic UI rollback on network error without disconnecting real Wi-Fi.
        </p>

        <div className="settings-toggle-group">
          <label className="notif-toggle-row">
            <div>
              <strong>Simulate Offline Mode</strong>
              <span className="notif-toggle-desc">Shows offline banner and prevents simulated remote calls</span>
            </div>
            <input
              type="checkbox"
              checked={!!settings.simulateOffline}
              onChange={(e) => dispatch(setSimulateOffline(e.target.checked))}
            />
          </label>

          <label className="notif-toggle-row">
            <div>
              <strong>Simulate Network Latency (400ms)</strong>
              <span className="notif-toggle-desc">Demonstrates optimistic UI updates while async call resolves</span>
            </div>
            <input
              type="checkbox"
              checked={!!settings.simulateNetworkDelay}
              onChange={(e) => dispatch(setSimulateNetworkDelay(e.target.checked))}
            />
          </label>

          <label className="notif-toggle-row">
            <div>
              <strong>Simulate Remote Network Failure</strong>
              <span className="notif-toggle-desc">Fails simulated API requests to verify automatic UI rollback</span>
            </div>
            <input
              type="checkbox"
              checked={!!settings.simulateNetworkFailure}
              onChange={(e) => dispatch(setSimulateNetworkFailure(e.target.checked))}
            />
          </label>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={handleSyncNow} disabled={settings.isSyncing}>
            <RefreshCw className={settings.isSyncing ? 'spin' : ''} />
            {settings.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            Last reconciled: {new Date(settings.lastSyncedAt).toLocaleTimeString()}
          </span>
        </div>
      </section>

      {/* Data Backup & Migration */}
      <section className="ws-settings-section">
        <h3 className="ws-settings-section-title">
          <Download style={{ width: 16, height: 16 }} />
          Data Persistence & Backup
        </h3>
        <p className="ws-settings-desc">Export current workspace data as structured JSON or restore from a backup.</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download />
            Export Current Workspace (JSON)
          </button>

          <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Import Workspace from JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {importSummary && (
          <div className="import-preview-box" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--accent-blue)' }}>
              <Check style={{ width: 16, height: 16 }} />
              Valid Backup Archive Detected
            </div>
            <p style={{ margin: '6px 0 10px', fontSize: 13, color: 'var(--ink-600)' }}>
              Contains workspace <strong>"{importSummary.summary.workspaceName}"</strong> with{' '}
              <strong>{importSummary.summary.projectCount}</strong> projects and{' '}
              <strong>{importSummary.summary.taskCount}</strong> tasks.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmImport}>
                Confirm & Import
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImportSummary(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="ws-settings-section danger">
        <h3 className="ws-settings-section-title danger">Danger Zone</h3>
        <p className="ws-danger-text">
          Clears all workspaces, projects, tasks, comments, and settings from browser storage.
        </p>

        <button type="button" className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
          <Trash2 />
          Reset All Application Data
        </button>
      </section>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset All Data?"
        message="This will completely wipe all local storage and IndexedDB records. You cannot undo this."
        confirmText="Reset Everything"
        cancelText="Keep My Data"
        requireInputMatch="RESET"
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
