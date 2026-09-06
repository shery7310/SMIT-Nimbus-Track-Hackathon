import { logActivity } from './activitySlice';
import { addNotification } from './notificationsSlice';
import { addToast } from './toastSlice';
import { pushHistory } from './undoRedoSlice';
import { restoreTask, deleteTask, updateTask, moveTaskToColumn } from './tasksSlice';

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done', blocked: 'Blocked' };

function findTask(state, id) {
  return state.tasks.tasks.find((t) => t.id === id);
}

export const activityMiddleware = (store) => (next) => (action) => {
  const prevState = store.getState();
  const result = next(action);
  const nextState = store.getState();
  const actingUserId = nextState.auth.user?.id || null;
  const currentUserId = nextState.auth.user?.id || null;

  const push = (entry) => {
    if (!actingUserId) return;
    store.dispatch(logActivity({ ...entry, actingUserId }));
  };

  switch (action.type) {
    case 'tasks/createTask': {
      const created = nextState.tasks.tasks[nextState.tasks.tasks.length - 1];
      if (created) {
        push({
          type: 'created',
          taskId: created.id,
          projectId: created.projectId,
          workspaceId: created.workspaceId,
          message: `created "${created.title}"`,
        });

        // Trigger notification if assigned
        if (created.assigneeId && created.assigneeId === currentUserId && actingUserId !== currentUserId) {
          store.dispatch(
            addNotification({
              type: 'assigned',
              title: 'Task Assigned',
              message: `You were assigned to "${created.title}"`,
              taskId: created.id,
              projectId: created.projectId,
              workspaceId: created.workspaceId,
            })
          );
        }

        // Push to Undo stack & show toast
        store.dispatch(
          pushHistory({
            description: `create task "${created.title}"`,
            undoAction: deleteTask(created.id),
            redoAction: restoreTask(created),
          })
        );
        store.dispatch(
          addToast({
            message: `Created task "${created.title}"`,
            type: 'success',
            action: { label: 'Undo', actionType: 'undo' },
          })
        );
      }
      break;
    }

    case 'tasks/deleteTask': {
      const removed = findTask(prevState, action.payload);
      if (removed) {
        push({
          type: 'deleted',
          taskId: removed.id,
          projectId: removed.projectId,
          workspaceId: removed.workspaceId,
          message: `deleted "${removed.title}"`,
        });

        // Push to Undo stack & show toast
        store.dispatch(
          pushHistory({
            description: `delete task "${removed.title}"`,
            undoAction: restoreTask(removed),
            redoAction: deleteTask(removed.id),
          })
        );
        store.dispatch(
          addToast({
            message: `Task "${removed.title}" deleted`,
            type: 'warning',
            action: { label: 'Undo', actionType: 'undo' },
          })
        );
      }
      break;
    }

    case 'tasks/updateTask': {
      const { id, changes } = action.payload;
      const before = findTask(prevState, id);
      const after = findTask(nextState, id);
      if (!before || !after) break;

      // Track reverse changes for undo
      const reverseChanges = {};
      Object.keys(changes).forEach((key) => {
        reverseChanges[key] = before[key];
      });

      store.dispatch(
        pushHistory({
          description: `update task "${after.title}"`,
          undoAction: updateTask({ id, changes: reverseChanges }),
          redoAction: updateTask({ id, changes }),
        })
      );

      if ('status' in changes && before.status !== after.status) {
        push({
          type: 'status_changed',
          taskId: id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `moved "${after.title}" from ${STATUS_LABELS[before.status] || before.status} to ${STATUS_LABELS[after.status] || after.status}`,
        });
        store.dispatch(
          addToast({
            message: `Status set to ${STATUS_LABELS[after.status] || after.status}`,
            type: 'info',
            action: { label: 'Undo', actionType: 'undo' },
          })
        );
      } else if ('priority' in changes && before.priority !== after.priority) {
        push({
          type: 'edited',
          taskId: id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `changed priority of "${after.title}" to ${after.priority}`,
        });
      } else if ('assigneeId' in changes && before.assigneeId !== after.assigneeId) {
        push({
          type: 'edited',
          taskId: id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `reassigned "${after.title}"`,
        });
        // Notification trigger if newly assigned to current user
        if (after.assigneeId === currentUserId && actingUserId !== currentUserId) {
          store.dispatch(
            addNotification({
              type: 'assigned',
              title: 'Task Assigned',
              message: `You were assigned to "${after.title}"`,
              taskId: after.id,
              projectId: after.projectId,
              workspaceId: after.workspaceId,
            })
          );
        }
      } else if ('dueDate' in changes && before.dueDate !== after.dueDate) {
        push({
          type: 'edited',
          taskId: id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `updated the due date on "${after.title}"`,
        });
      } else if ('labels' in changes) {
        push({
          type: 'edited',
          taskId: id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `updated labels on "${after.title}"`,
        });
      }
      break;
    }

    case 'tasks/toggleTaskComplete': {
      const before = findTask(prevState, action.payload);
      const after = findTask(nextState, action.payload);
      if (after && before) {
        push({
          type: 'status_changed',
          taskId: after.id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `marked "${after.title}" as ${after.status === 'done' ? 'complete' : 'incomplete'}`,
        });

        store.dispatch(
          pushHistory({
            description: `toggle complete on "${after.title}"`,
            undoAction: updateTask({ id: after.id, changes: { status: before.status } }),
            redoAction: updateTask({ id: after.id, changes: { status: after.status } }),
          })
        );
        store.dispatch(
          addToast({
            message: `Marked "${after.title}" as ${after.status === 'done' ? 'complete' : 'incomplete'}`,
            type: 'info',
            action: { label: 'Undo', actionType: 'undo' },
          })
        );
      }
      break;
    }

    case 'tasks/moveTaskToColumn': {
      const { taskId, columnId } = action.payload;
      const before = findTask(prevState, taskId);
      const after = findTask(nextState, taskId);
      if (after && before) {
        push({
          type: 'status_changed',
          taskId: after.id,
          projectId: after.projectId,
          workspaceId: after.workspaceId,
          message: `moved "${after.title}" on the board`,
        });

        store.dispatch(
          pushHistory({
            description: `move "${after.title}"`,
            undoAction: moveTaskToColumn({ taskId, columnId: before.columnId }),
            redoAction: moveTaskToColumn({ taskId, columnId }),
          })
        );
      }
      break;
    }

    case 'tasks/addComment': {
      const after = findTask(nextState, action.payload.taskId);
      if (after) {
        const comment = after.comments?.[after.comments.length - 1];
        if (!action.payload.simulated) {
          push({
            type: 'commented',
            taskId: after.id,
            commentId: comment?.id || null,
            projectId: after.projectId,
            workspaceId: after.workspaceId,
            message: `commented on "${after.title}"`,
          });
        }

        // Notification trigger if currentUser mentioned
        if (
          comment &&
          action.payload.mentionedUserIds &&
          action.payload.mentionedUserIds.includes(currentUserId) &&
          action.payload.authorId !== currentUserId
        ) {
          store.dispatch(
            addNotification({
              type: 'mentioned',
              title: 'Mentioned in comment',
              message: `You were mentioned in a comment on "${after.title}"`,
              taskId: after.id,
              projectId: after.projectId,
              workspaceId: after.workspaceId,
              commentId: comment.id,
            })
          );
        }
      }
      break;
    }

    case 'tasks/bulkUpdateStatus': {
      const { taskIds, status } = action.payload;
      taskIds.forEach((id) => {
        const after = findTask(nextState, id);
        if (after) {
          push({
            type: 'status_changed',
            taskId: after.id,
            projectId: after.projectId,
            workspaceId: after.workspaceId,
            message: `bulk-moved "${after.title}" to ${STATUS_LABELS[status] || status}`,
          });
        }
      });
      break;
    }

    case 'tasks/bulkDelete': {
      action.payload.forEach((id) => {
        const removed = findTask(prevState, id);
        if (removed) {
          push({
            type: 'deleted',
            taskId: removed.id,
            projectId: removed.projectId,
            workspaceId: removed.workspaceId,
            message: `bulk-deleted "${removed.title}"`,
          });
        }
      });
      break;
    }

    default:
      break;
  }

  return result;
};
