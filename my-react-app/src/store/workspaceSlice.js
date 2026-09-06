import { createSlice } from '@reduxjs/toolkit';

const WS_STORAGE_KEY = 'workspace_manager_workspaces';
const ACTIVE_STORAGE_KEY = 'workspace_manager_active_ws';

export const WORKSPACE_COLORS = [
  '#0052cc', '#36b37e', '#ff5630', '#ffab00',
  '#6554c0', '#00b8d9', '#de350b', '#172b4d',
];

const getStoredWorkspaces = () => {
  try {
    const raw = localStorage.getItem(WS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getStoredActiveId = () => {
  try {
    return localStorage.getItem(ACTIVE_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const persist = (state) => {
  localStorage.setItem(WS_STORAGE_KEY, JSON.stringify(state.workspaces));
  if (state.activeWorkspaceId) {
    localStorage.setItem(ACTIVE_STORAGE_KEY, state.activeWorkspaceId);
  } else {
    localStorage.removeItem(ACTIVE_STORAGE_KEY);
  }
};

const initialWorkspaces = getStoredWorkspaces();
const initialState = {
  workspaces: initialWorkspaces,
  activeWorkspaceId: getStoredActiveId() || initialWorkspaces[0]?.id || null,
};

const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    // { name, icon, color, ownerId }
    createWorkspace: (state, action) => {
      const { name, icon = 'Briefcase', color = WORKSPACE_COLORS[0], ownerId } = action.payload;
      const newWorkspace = {
        id: crypto.randomUUID(),
        name: name.trim(),
        icon,
        color,
        defaultView: 'list',
        memberIds: ownerId ? [ownerId] : [],
        createdAt: new Date().toISOString(),
      };
      state.workspaces.push(newWorkspace);
      state.activeWorkspaceId = newWorkspace.id;
      persist(state);
    },

    renameWorkspace: (state, action) => {
      const { id, name } = action.payload;
      const ws = state.workspaces.find((w) => w.id === id);
      if (ws) ws.name = name.trim();
      persist(state);
    },

    deleteWorkspace: (state, action) => {
      const id = action.payload;
      state.workspaces = state.workspaces.filter((w) => w.id !== id);
      if (state.activeWorkspaceId === id) {
        state.activeWorkspaceId = state.workspaces[0]?.id || null;
      }
      persist(state);
    },

    switchWorkspace: (state, action) => {
      state.activeWorkspaceId = action.payload;
      persist(state);
    },

    // { id, changes: { name?, icon?, color?, defaultView? } }
    updateWorkspaceSettings: (state, action) => {
      const { id, changes } = action.payload;
      const ws = state.workspaces.find((w) => w.id === id);
      if (ws) Object.assign(ws, changes);
      persist(state);
    },

    // { workspaceId, userId }
    inviteMember: (state, action) => {
      const { workspaceId, userId } = action.payload;
      const ws = state.workspaces.find((w) => w.id === workspaceId);
      if (ws && !ws.memberIds.includes(userId)) {
        ws.memberIds.push(userId);
      }
      persist(state);
    },

    // { workspaceId, userId }
    removeMember: (state, action) => {
      const { workspaceId, userId } = action.payload;
      const ws = state.workspaces.find((w) => w.id === workspaceId);
      if (ws) ws.memberIds = ws.memberIds.filter((id) => id !== userId);
      persist(state);
    },
  },
});

export const {
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  switchWorkspace,
  updateWorkspaceSettings,
  inviteMember,
  removeMember,
} = workspacesSlice.actions;

export default workspacesSlice.reducer;