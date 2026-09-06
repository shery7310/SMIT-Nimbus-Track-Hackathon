import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action) => {
      // action.payload: { id?, message, type: 'info'|'success'|'error'|'warning', duration?: number, action?: { label: string, actionType: string, payload?: any } }
      const newToast = {
        id: action.payload.id || crypto.randomUUID(),
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration ?? 4500,
        action: action.payload.action || null,
        createdAt: Date.now(),
      };
      state.toasts.push(newToast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;
