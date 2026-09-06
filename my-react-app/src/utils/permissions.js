// Client-side permissions for this frontend-only project.
const ROLE_RANK = { Viewer: 0, Member: 1, Admin: 2, Owner: 3 };
const GATED_STATUSES = ['done', 'blocked'];

export function getRole(user) {
  return user?.role ?? 'Viewer';
}

export function roleAtLeast(user, minimumRole) {
  return (ROLE_RANK[getRole(user)] ?? 0) >= ROLE_RANK[minimumRole];
}

export function isGatedStatus(status) {
  return GATED_STATUSES.includes(status);
}

// Members can edit their assigned tasks
export function canEditTask(user) {
  return roleAtLeast(user, 'Member');
}

// Only Admins and Owners can create tasks
export function canCreateTask(user) {
  return roleAtLeast(user, 'Admin');
}

// Only Admins and Owners can create projects
export function canCreateProject(user) {
  return roleAtLeast(user, 'Admin');
}

export function canChangeTaskStatus(user, task) {
  if (roleAtLeast(user, 'Admin')) return true;
  if (roleAtLeast(user, 'Member')) {
    // Use String() to prevent type mismatch issues (e.g., 1 === "1" failing)
    return String(task?.assigneeId) === String(user?.id);
  }
  return false;
}

// Keep canCompleteTask aligned with this logic
export function canCompleteTask(user, task) {
  return canSetStatus(user, 'done', task);
}
// Only Admins and Owners can delete tasks
export function canDeleteTask(user) {
  return roleAtLeast(user, 'Admin');
}

export function canSetStatus(user, status, task = null) {
  if (roleAtLeast(user, 'Admin')) return true;
  if (roleAtLeast(user, 'Member') && task && String(task.assigneeId) === String(user.id)) {
    return true; // Allow assignee to change status, even to done/blocked
  }
  return false;
}

export function canApproveDone(user) {
  return canSetStatus(user, 'done');
}

// Only Admins and Owners can edit project settings
export function canEditProject(user) {
  return roleAtLeast(user, 'Admin');
}

// Only Admins and Owners can delete a workspace or project
export function canDeleteWorkspace(user) {
  return roleAtLeast(user, 'Admin');
}

export function canDeleteProject(user) {
  return roleAtLeast(user, 'Admin');
}

// Only Admins and Owners can edit workspace settings
export function canEditWorkspace(user) {
  return roleAtLeast(user, 'Admin');
}

export function isAdmin(user) {
  return roleAtLeast(user, 'Admin');
}

// Members and above can comment
export function canComment(user) {
  return roleAtLeast(user, 'Member');
}

// Comments live inside projects. Admins and Owners may moderate project comments
export function canModerateProjectComments(user) {
  return roleAtLeast(user, 'Admin');
}

export function canDeleteComment(user, comment) {
  if (!user) return false;
  // Owner or Admin can delete any comment
  if (roleAtLeast(user, 'Admin')) return true;
  // Comment author can delete their own comment
  return comment?.authorId === user?.id;
}