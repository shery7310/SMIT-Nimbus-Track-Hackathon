import { createSlice } from '@reduxjs/toolkit';

const SETTINGS_KEY = 'workspace_manager_app_settings';

const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          theme: 'light',
          defaultView: 'list',
          simulateOffline: false,
          simulateNetworkDelay: false,
          simulateNetworkFailure: false,
          lastSyncedAt: new Date().toISOString(),
        };
  } catch {
    return {
      theme: 'light',
      defaultView: 'list',
      simulateOffline: false,
      simulateNetworkDelay: false,
      simulateNetworkFailure: false,
      lastSyncedAt: new Date().toISOString(),
    };
  }
};

const persist = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to persist settings:', e);
  }
};

const stored = getStoredSettings();

const initialState = {
  ...stored,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
};

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', stored.theme || 'light');
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      persist(state);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      persist(state);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
    },
    setDefaultViewPreference: (state, action) => {
      state.defaultView = action.payload;
      persist(state);
    },
    setSimulateOffline: (state, action) => {
      state.simulateOffline = action.payload;
      persist(state);
    },
    setSimulateNetworkDelay: (state, action) => {
      state.simulateNetworkDelay = action.payload;
      persist(state);
    },
    setSimulateNetworkFailure: (state, action) => {
      state.simulateNetworkFailure = action.payload;
      persist(state);
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
    updateLastSyncedAt: (state) => {
      state.lastSyncedAt = new Date().toISOString();
      persist(state);
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setDefaultViewPreference,
  setSimulateOffline,
  setSimulateNetworkDelay,
  setSimulateNetworkFailure,
  setOnlineStatus,
  setSyncing,
  updateLastSyncedAt,
  toggleSidebarCollapsed
} = settingsSlice.actions;

export default settingsSlice.reducer;