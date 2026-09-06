// IndexedDB database name and stores
const DB_NAME = 'WorkspaceManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

function openIDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function saveToIndexedDB(key, data) {
  try {
    const db = await openIDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, key);
  } catch (err) {
    console.warn('IndexedDB save error:', err);
  }
}

export async function getFromIndexedDB(key) {
  try {
    const db = await openIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function exportWorkspaceData({ workspace, projects, tasks, activity }) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    workspace,
    projects: projects.filter((p) => p.workspaceId === workspace.id),
    tasks: tasks.filter((t) => t.workspaceId === workspace.id),
    activity: activity.filter((a) => a.workspaceId === workspace.id),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (workspace.name || 'workspace').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  a.download = `workspace-${safeName}-export.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateWorkspaceJSON(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File does not contain a valid JSON object.' };
    }

    if (!parsed.workspace || typeof parsed.workspace !== 'object') {
      return { valid: false, error: 'Missing or invalid "workspace" field.' };
    }

    if (!parsed.workspace.name) {
      return { valid: false, error: 'Workspace is missing a name.' };
    }

    if (!Array.isArray(parsed.projects)) {
      return { valid: false, error: 'Missing or invalid "projects" array.' };
    }

    if (!Array.isArray(parsed.tasks)) {
      return { valid: false, error: 'Missing or invalid "tasks" array.' };
    }

    return {
      valid: true,
      summary: {
        workspaceName: parsed.workspace.name,
        projectCount: parsed.projects.length,
        taskCount: parsed.tasks.length,
        activityCount: Array.isArray(parsed.activity) ? parsed.activity.length : 0,
      },
      data: parsed,
    };
  } catch (err) {
    return { valid: false, error: `JSON Parse error: ${err.message}` };
  }
}

export function resetAllAppData() {
  try {
    const keysToRemove = [
      'workspace_manager_workspaces',
      'workspace_manager_active_ws',
      'workspace_manager_projects',
      'workspace_manager_tasks',
      'workspace_manager_activity',
      'workspace_manager_notifications',
      'workspace_manager_notification_prefs',
      'workspace_manager_app_settings',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase(DB_NAME);
    }
  } catch (err) {
    console.error('Error clearing data:', err);
  }
}
