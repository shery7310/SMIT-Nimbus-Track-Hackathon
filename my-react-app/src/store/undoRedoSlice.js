import { createSlice } from '@reduxjs/toolkit';
import { addToast } from './toastSlice';

const MAX_HISTORY = 50;

const initialState = {
  past: [],
  future: [],
};

const undoRedoSlice = createSlice({
  name: 'undoRedo',
  initialState,
  reducers: {
    pushHistory: (state, action) => {
      // payload: { description, undoAction: { type, payload }, redoAction: { type, payload } }
      state.past.push({
        id: crypto.randomUUID(),
        description: action.payload.description,
        undoAction: action.payload.undoAction,
        redoAction: action.payload.redoAction,
        timestamp: Date.now(),
      });
      if (state.past.length > MAX_HISTORY) {
        state.past.shift();
      }
      state.future = [];
    },
    popUndo: (state) => {
      if (state.past.length > 0) {
        const item = state.past.pop();
        state.future.push(item);
      }
    },
    popRedo: (state) => {
      if (state.future.length > 0) {
        const item = state.future.pop();
        state.past.push(item);
      }
    },
    clearHistory: (state) => {
      state.past = [];
      state.future = [];
    },
  },
});

export const { pushHistory, popUndo, popRedo, clearHistory } = undoRedoSlice.actions;

// Thunk to execute undo
export const performUndo = () => (dispatch, getState) => {
  const { past } = getState().undoRedo;
  if (!past || past.length === 0) return false;

  const current = past[past.length - 1];
  dispatch(popUndo());
  dispatch(current.undoAction);
  dispatch(
    addToast({
      message: `Undid: ${current.description}`,
      type: 'info',
      duration: 3000,
    })
  );
  return true;
};

// Thunk to execute redo
export const performRedo = () => (dispatch, getState) => {
  const { future } = getState().undoRedo;
  if (!future || future.length === 0) return false;

  const current = future[future.length - 1];
  dispatch(popRedo());
  dispatch(current.redoAction);
  dispatch(
    addToast({
      message: `Redid: ${current.description}`,
      type: 'info',
      duration: 3000,
    })
  );
  return true;
};

export default undoRedoSlice.reducer;
