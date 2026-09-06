import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import workspacesReducer from './workspacesSlice';
import projectsReducer from './projectsSlice';
import tasksReducer from './tasksSlice';
import activityReducer from './activitySlice';
import toastReducer from './toastSlice';
import undoRedoReducer from './undoRedoSlice';
import notificationsReducer from './notificationsSlice';
import settingsReducer from './settingsSlice';
import { activityMiddleware } from './activityMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspaces: workspacesReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    activity: activityReducer,
    toast: toastReducer,
    undoRedo: undoRedoReducer,
    notifications: notificationsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore action functions in toast or history
        ignoredActionPaths: ['payload.action.onClick', 'payload.undoAction', 'payload.redoAction'],
        ignoredPaths: ['undoRedo.past', 'undoRedo.future', 'toast.toasts'],
      },
    }).concat(activityMiddleware),
});
