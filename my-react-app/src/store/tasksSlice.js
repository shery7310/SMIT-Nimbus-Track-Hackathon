import { createSlice } from '@reduxjs/toolkit';

const TASKS_STORAGE_KEY = 'workspace_manager_tasks';

const getStoredTasks = () => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (tasks) => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to persist tasks:', e);
  }
};

const initialState = {
  tasks: getStoredTasks(),
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    createTask: (state, action) => {
      const {
        id = crypto.randomUUID(),
        projectId,
        workspaceId,
        title,
        description = '',
        status = 'todo',
        columnId = 'col_todo',
        priority = 'medium',
        dueDate = null,
        assigneeId = null,
        labels = [],
        subtasks = [],
        attachments = [],
        comments = [],
        createdAt = new Date().toISOString(),
        updatedAt = new Date().toISOString(),
      } = action.payload;

      const newTask = {
        id,
        projectId,
        workspaceId,
        title: title.trim(),
        description: description.trim(),
        status,
        columnId,
        priority,
        dueDate,
        assigneeId,
        labels,
        subtasks,
        attachments,
        comments,
        createdAt,
        updatedAt,
      };
      state.tasks.push(newTask);
      persist(state.tasks);
    },

    restoreTask: (state, action) => {
      const existing = state.tasks.find((t) => t.id === action.payload.id);
      if (!existing) {
        state.tasks.push(action.payload);
        persist(state.tasks);
      }
    },

    updateTask: (state, action) => {
      const { id, changes } = action.payload;
      const task = state.tasks.find((t) => t.id === id);
      if (task) {
        Object.assign(task, changes, { updatedAt: new Date().toISOString() });
      }
      persist(state.tasks);
    },

    deleteTask: (state, action) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      persist(state.tasks);
    },

    duplicateTask: (state, action) => {
      const original = state.tasks.find((t) => t.id === action.payload);
      if (!original) return;
      const copy = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title} (Copy)`,
        subtasks: original.subtasks.map((s) => ({ ...s, id: crypto.randomUUID(), completed: false })),
        attachments: (original.attachments || []).map((a) => ({ ...a, id: crypto.randomUUID() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.tasks.push(copy);
      persist(state.tasks);
    },

    toggleTaskComplete: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = task.status === 'done' ? 'todo' : 'done';
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    moveTaskToColumn: (state, action) => {
      const { taskId, columnId } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.columnId = columnId;
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    addSubtask: (state, action) => {
      const { taskId, title } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.subtasks.push({
          id: crypto.randomUUID(),
          title: title.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
        });
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    toggleSubtask: (state, action) => {
      const { taskId, subtaskId } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const sub = task.subtasks.find((s) => s.id === subtaskId);
      if (sub) {
        sub.completed = !sub.completed;
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    deleteSubtask: (state, action) => {
      const { taskId, subtaskId } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    addAttachment: (state, action) => {
      const { taskId, attachment } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        if (!task.attachments) task.attachments = [];
        task.attachments.push({
          id: crypto.randomUUID(),
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          dataUrl: attachment.dataUrl,
          createdAt: new Date().toISOString(),
        });
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    removeAttachment: (state, action) => {
      const { taskId, attachmentId } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.attachments = (task.attachments || []).filter((a) => a.id !== attachmentId);
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    addComment: (state, action) => {
      const { taskId, authorId, text, mentionedUserIds = [], simulated = false } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task && text.trim()) {
        if (!task.comments) task.comments = [];
        task.comments.push({
          id: crypto.randomUUID(),
          authorId,
          text: text.trim(),
          mentionedUserIds,
          simulated,
          createdAt: new Date().toISOString(),
          editedAt: null,
        });
        task.updatedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    editComment: (state, action) => {
      const { taskId, commentId, text } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      const comment = task?.comments?.find((c) => c.id === commentId);
      if (comment && text.trim()) {
        comment.text = text.trim();
        comment.editedAt = new Date().toISOString();
      }
      persist(state.tasks);
    },

    deleteComment: (state, action) => {
      const { taskId, commentId } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.comments = (task.comments || []).filter((c) => c.id !== commentId);
      }
      persist(state.tasks);
    },

    convertSubtaskToTask: (state, action) => {
      const { taskId, subtaskId } = action.payload;
      const parentTask = state.tasks.find((t) => t.id === taskId);
      if (!parentTask) return;
      const sub = parentTask.subtasks.find((s) => s.id === subtaskId);
      if (!sub) return;

      const newTask = {
        id: crypto.randomUUID(),
        projectId: parentTask.projectId,
        workspaceId: parentTask.workspaceId,
        title: sub.title,
        description: '',
        status: 'todo',
        columnId: parentTask.columnId,
        priority: parentTask.priority,
        dueDate: null,
        assigneeId: null,
        labels: [],
        subtasks: [],
        attachments: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.tasks.push(newTask);
      parentTask.subtasks = parentTask.subtasks.filter((s) => s.id !== subtaskId);
      parentTask.updatedAt = new Date().toISOString();
      persist(state.tasks);
    },

    convertTaskToSubtask: (state, action) => {
      const { taskId, parentTaskId } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      const parent = state.tasks.find((t) => t.id === parentTaskId);
      if (!task || !parent || taskId === parentTaskId) return;

      parent.subtasks.push({
        id: crypto.randomUUID(),
        title: task.title,
        completed: task.status === 'done',
        createdAt: new Date().toISOString(),
      });
      parent.updatedAt = new Date().toISOString();
      state.tasks = state.tasks.filter((t) => t.id !== taskId);
      persist(state.tasks);
    },

    bulkUpdateStatus: (state, action) => {
      const { taskIds, status } = action.payload;
      taskIds.forEach((id) => {
        const task = state.tasks.find((t) => t.id === id);
        if (task) {
          task.status = status;
          task.updatedAt = new Date().toISOString();
        }
      });
      persist(state.tasks);
    },

    bulkUpdateAssignee: (state, action) => {
      const { taskIds, assigneeId } = action.payload;
      taskIds.forEach((id) => {
        const task = state.tasks.find((t) => t.id === id);
        if (task) {
          task.assigneeId = assigneeId;
          task.updatedAt = new Date().toISOString();
        }
      });
      persist(state.tasks);
    },

    bulkDelete: (state, action) => {
      state.tasks = state.tasks.filter((t) => !action.payload.includes(t.id));
      persist(state.tasks);
    },
  },
});

export const {
  createTask,
  restoreTask,
  updateTask,
  deleteTask,
  duplicateTask,
  toggleTaskComplete,
  moveTaskToColumn,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addAttachment,
  removeAttachment,
  addComment,
  editComment,
  deleteComment,
  convertSubtaskToTask,
  convertTaskToSubtask,
  bulkUpdateStatus,
  bulkUpdateAssignee,
  bulkDelete,
} = tasksSlice.actions;

export default tasksSlice.reducer;
