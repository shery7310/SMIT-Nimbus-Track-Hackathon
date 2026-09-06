import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'workspace_manager_notifications';
const PREFS_KEY = 'workspace_manager_notification_prefs';

const getStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getStoredPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { assigned: true, mentioned: true, due_soon: true };
  } catch {
    return { assigned: true, mentioned: true, due_soon: true };
  }
};

const persist = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to persist notifications:', e);
  }
};

const persistPrefs = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to persist notification preferences:', e);
  }
};

const initialState = {
  notifications: getStoredNotifications(),
  preferences: getStoredPrefs(),
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // payload: { type: 'assigned'|'mentioned'|'due_soon'|'system', title, message, taskId?, projectId?, workspaceId?, commentId? }
      const { type } = action.payload;
      if (state.preferences[type] === false) {
        return; // User disabled this notification type
      }

      // Avoid creating duplicate due_soon notifications for the same task
      if (type === 'due_soon' && action.payload.taskId) {
        const alreadyExists = state.notifications.some(
          (n) => n.type === 'due_soon' && n.taskId === action.payload.taskId && !n.read
        );
        if (alreadyExists) return;
      }

      const item = {
        id: crypto.randomUUID(),
        type,
        title: action.payload.title,
        message: action.payload.message,
        taskId: action.payload.taskId || null,
        projectId: action.payload.projectId || null,
        workspaceId: action.payload.workspaceId || null,
        commentId: action.payload.commentId || null,
        read: false,
        createdAt: new Date().toISOString(),
      };

      state.notifications.unshift(item);
      if (state.notifications.length > 200) {
        state.notifications.length = 200;
      }
      persist(state.notifications);
    },

    markAsRead: (state, action) => {
      const n = state.notifications.find((item) => item.id === action.payload);
      if (n) {
        n.read = true;
        persist(state.notifications);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      persist(state.notifications);
    },

    deleteNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      persist(state.notifications);
    },

    clearNotifications: (state) => {
      state.notifications = [];
      persist(state.notifications);
    },

    updatePreference: (state, action) => {
      const { key, value } = action.payload;
      state.preferences[key] = value;
      persistPrefs(state.preferences);
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  updatePreference,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
