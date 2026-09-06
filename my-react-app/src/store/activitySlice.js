import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'workspace_manager_activity';
const MAX_ENTRIES = 500; // keep localStorage from growing forever

const getStored = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const persist = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const initialState = {
  entries: getStored(),
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // { type, taskId, projectId, workspaceId, message, actingUserId }
    // Normally dispatched by activityMiddleware.js, not called directly.
    logActivity: (state, action) => {
      state.entries.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
      if (state.entries.length > MAX_ENTRIES) {
        state.entries.length = MAX_ENTRIES;
      }
      persist(state.entries);
    },

    clearActivity: (state) => {
      state.entries = [];
      persist(state.entries);
    },
  },
});

export const { logActivity, clearActivity } = activitySlice.actions;
export default activitySlice.reducer;