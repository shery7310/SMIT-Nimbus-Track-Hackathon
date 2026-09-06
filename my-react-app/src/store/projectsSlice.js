import { createSlice } from '@reduxjs/toolkit';

const PROJECTS_STORAGE_KEY = 'workspace_manager_projects';

const getStoredProjects = () => {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (projects) => {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
};

// Default columns for new projects
const DEFAULT_COLUMNS = [
  { id: 'col_todo', name: 'To Do', order: 0 },
  { id: 'col_in_progress', name: 'In Progress', order: 1 },
  { id: 'col_review', name: 'Review', order: 2 },
  { id: 'col_done', name: 'Done', order: 3 },
];

const initialState = {
  projects: getStoredProjects(),
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    createProject: (state, action) => {
      const { id = crypto.randomUUID(), workspaceId, name, description = '', icon = 'Briefcase', color = '#0052cc', memberIds = [], dueDate = null } = action.payload;
      const newProject = {
        id,
        workspaceId,
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        status: 'active',
        memberIds,
        dueDate,
        defaultView: 'list',
        createdAt: new Date().toISOString(),
        taskIds: [],
        columns: DEFAULT_COLUMNS.map(col => ({ ...col })), // Deep copy defaults
      };
      state.projects.push(newProject);
      persist(state.projects);
    },

    renameProject: (state, action) => {
      const { id, name } = action.payload;
      const p = state.projects.find((proj) => proj.id === id);
      if (p) p.name = name.trim();
      persist(state.projects);
    },

    updateProjectDescription: (state, action) => {
      const { id, description } = action.payload;
      const p = state.projects.find((proj) => proj.id === id);
      if (p) p.description = description.trim();
      persist(state.projects);
    },

    updateProjectSettings: (state, action) => {
      const { id, changes } = action.payload;
      const p = state.projects.find((proj) => proj.id === id);
      if (p) Object.assign(p, changes);
      persist(state.projects);
    },

    archiveProject: (state, action) => {
      const p = state.projects.find((proj) => proj.id === action.payload);
      if (p) p.status = 'archived';
      persist(state.projects);
    },

    unarchiveProject: (state, action) => {
      const p = state.projects.find((proj) => proj.id === action.payload);
      if (p) p.status = 'active';
      persist(state.projects);
    },

    deleteProject: (state, action) => {
      state.projects = state.projects.filter((proj) => proj.id !== action.payload);
      persist(state.projects);
    },

    assignMember: (state, action) => {
      const { projectId, userId } = action.payload;
      const p = state.projects.find((proj) => proj.id === projectId);
      if (p && !p.memberIds.includes(userId)) {
        p.memberIds.push(userId);
      }
      persist(state.projects);
    },

    removeMember: (state, action) => {
      const { projectId, userId } = action.payload;
      const p = state.projects.find((proj) => proj.id === projectId);
      if (p) {
        p.memberIds = p.memberIds.filter((id) => id !== userId);
      }
      persist(state.projects);
    },

    // Column management
    createColumn: (state, action) => {
      const { projectId, name } = action.payload;
      const p = state.projects.find((proj) => proj.id === projectId);
      if (p) {
        if (!p.columns) p.columns = [];
        const maxOrder = p.columns.length > 0 ? Math.max(...p.columns.map(c => c.order)) : -1;
        p.columns.push({
          id: crypto.randomUUID(),
          name: name.trim(),
          order: maxOrder + 1,
        });
      }
      persist(state.projects);
    },

    renameColumn: (state, action) => {
      const { projectId, columnId, name } = action.payload;
      const p = state.projects.find((proj) => proj.id === projectId);
      if (p) {
        const col = p.columns?.find((c) => c.id === columnId);
        if (col) col.name = name.trim();
      }
      persist(state.projects);
    },

    deleteColumn: (state, action) => {
      const { projectId, columnId } = action.payload;
      const p = state.projects.find((proj) => proj.id === projectId);
      if (p) {
        p.columns = p.columns?.filter((c) => c.id !== columnId) || [];
      }
      persist(state.projects);
    },

    reorderColumns: (state, action) => {
      const { projectId, newOrder } = action.payload; // newOrder: array of column ids in new order
      const p = state.projects.find((proj) => proj.id === projectId);
      if (p && p.columns) {
        newOrder.forEach((colId, index) => {
          const col = p.columns.find((c) => c.id === colId);
          if (col) col.order = index;
        });
      }
      persist(state.projects);
    },
  },
});

export const {
  createProject,
  renameProject,
  updateProjectDescription,
  updateProjectSettings,
  archiveProject,
  unarchiveProject,
  deleteProject,
  assignMember,
  removeMember,
  createColumn,
  renameColumn,
  deleteColumn,
  reorderColumns,
} = projectsSlice.actions;

export default projectsSlice.reducer;