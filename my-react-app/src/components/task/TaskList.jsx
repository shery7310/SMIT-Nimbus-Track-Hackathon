import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trash2 } from 'lucide-react';
import TaskCard from './TaskCard';
import { bulkUpdateStatus, bulkUpdateAssignee, bulkDelete } from '../../store/tasksSlice';
import { canEditTask, canSetStatus } from '../../utils/permissions';
import TaskFilters, { EMPTY_FILTERS } from './TaskFilters';

const PRIORITY_RANK = { urgent: 4, high: 3, medium: 2, low: 1 };
const STATUS_ORDER = ['todo', 'in-progress', 'blocked', 'done'];
const STATUS_LABEL = { todo: 'To Do', 'in-progress': 'In Progress', blocked: 'Blocked', done: 'Done' };
const PRIORITY_LABEL = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };

function sortTasks(list, sortBy) {
  const sorted = [...list];
  switch (sortBy) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1; // no due date sinks to the bottom
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'priority':
      return sorted.sort((a, b) => (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0));
    case 'created':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

// Builds ordered {key, label, tasks} groups. Labels are multi-valued, so a
// task can legitimately land in more than one label group — everything
// else is a single-value grouping.
function buildGroups(tasks, groupBy, allUsers) {
  if (groupBy === 'none') return [{ key: 'all', label: null, tasks }];

  if (groupBy === 'status') {
    return STATUS_ORDER
      .map((status) => ({ key: status, label: STATUS_LABEL[status], tasks: tasks.filter((t) => t.status === status) }))
      .filter((g) => g.tasks.length > 0);
  }

  if (groupBy === 'priority') {
    return Object.keys(PRIORITY_RANK)
      .sort((a, b) => PRIORITY_RANK[b] - PRIORITY_RANK[a])
      .map((p) => ({ key: p, label: PRIORITY_LABEL[p], tasks: tasks.filter((t) => t.priority === p) }))
      .filter((g) => g.tasks.length > 0);
  }

  if (groupBy === 'assignee') {
    const groups = allUsers
      .map((u) => ({ key: u.id, label: `${u.firstName} ${u.lastName}`, tasks: tasks.filter((t) => t.assigneeId === u.id) }))
      .filter((g) => g.tasks.length > 0);
    const unassigned = tasks.filter((t) => !t.assigneeId);
    if (unassigned.length > 0) groups.push({ key: 'unassigned', label: 'Unassigned', tasks: unassigned });
    return groups;
  }

  if (groupBy === 'label') {
    const allLabels = [...new Set(tasks.flatMap((t) => t.labels || []))].sort((a, b) => a.localeCompare(b));
    const groups = allLabels.map((label) => ({
      key: label,
      label,
      tasks: tasks.filter((t) => (t.labels || []).includes(label)),
    }));
    const unlabeled = tasks.filter((t) => (t.labels || []).length === 0);
    if (unlabeled.length > 0) groups.push({ key: 'no-label', label: 'No label', tasks: unlabeled });
    return groups;
  }

  return [{ key: 'all', label: null, tasks }];
}

export default function TaskList({ projectId, onTaskClick }) {
  const dispatch = useDispatch();
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('created');
  const [groupBy, setGroupBy] = useState('none');

  const tasks = useSelector((state) =>
    state.tasks.tasks.filter((t) => t.projectId === projectId)
  );
  const allUsers = useSelector((state) => state.auth.users);
  const currentUser = useSelector((state) => state.auth.user);
  const canEdit = canEditTask(currentUser);
  const canApprove = canSetStatus(currentUser, 'done');
  const project = useSelector((state) =>
    state.projects.projects.find((p) => p.id === projectId)
  );
  const projectMembers = allUsers.filter((u) => project?.memberIds.includes(u.id));

  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assigneeId === 'unassigned' && task.assigneeId) return false;
    if (filters.assigneeId !== 'all' && filters.assigneeId !== 'unassigned' && task.assigneeId !== filters.assigneeId) return false;
    if (filters.label !== 'all' && !(task.labels || []).includes(filters.label)) return false;
    const due = task.dueDate ? task.dueDate.slice(0, 10) : '';
    if (filters.dueFrom && (!due || due < filters.dueFrom)) return false;
    if (filters.dueTo && (!due || due > filters.dueTo)) return false;
    return true;
  });
  const sortedTasks = sortTasks(filteredTasks, sortBy);
  const groups = buildGroups(sortedTasks, groupBy, projectMembers);

  const handleSelect = (id, checked) => {
    if (!canEdit) return;
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  const handleSelectAll = () => {
    if (!canEdit) return;
    if (selectedIds.length === filteredTasks.length) setSelectedIds([]);
    else setSelectedIds(filteredTasks.map((t) => t.id));
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkStatus = (status) => {
    if (!status || !canSetStatus(currentUser, status)) return;
    dispatch(bulkUpdateStatus({ taskIds: selectedIds, status }));
    clearSelection();
  };

  const handleBulkAssignee = (assigneeId) => {
    if (!canEdit) return;
    dispatch(bulkUpdateAssignee({ taskIds: selectedIds, assigneeId: assigneeId || null }));
    clearSelection();
  };

  const handleBulkDelete = () => {
    if (!canEdit) return;
    if (window.confirm(`Delete ${selectedIds.length} task${selectedIds.length !== 1 ? 's' : ''}?`)) {
      dispatch(bulkDelete(selectedIds));
      clearSelection();
    }
  };

  return (
    <div>
      <div className="task-toolbar" style={{ flexWrap: 'wrap' }}>
        {canEdit && <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={filteredTasks.length > 0 && selectedIds.length === filteredTasks.length}
            onChange={handleSelectAll}
          />
          Select all
        </label>}

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <TaskFilters tasks={tasks} members={projectMembers} filters={filters} onChange={setFilters} />

          <select
            className="btn btn-secondary btn-sm"
            style={{ padding: '5px 8px', fontSize: 12 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort by"
          >
            <option value="created">Newest first</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="alpha">Alphabetical</option>
          </select>

          <select
            className="btn btn-secondary btn-sm"
            style={{ padding: '5px 8px', fontSize: 12 }}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            title="Group by"
          >
            <option value="none">No grouping</option>
            <option value="status">Group by status</option>
            <option value="priority">Group by priority</option>
            <option value="assignee">Group by assignee</option>
            <option value="label">Group by label</option>
          </select>
        </div>

        <span className="task-count">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {canEdit && selectedIds.length > 0 && (
        <div className="task-bulk-bar">
          <span>{selectedIds.length} selected</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <select
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 8px', fontSize: 12 }}
              onChange={(e) => handleBulkStatus(e.target.value)}
              value=""
            >
              <option value="" disabled>Change status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              {canApprove && <option value="done">Done</option>}
              {canApprove && <option value="blocked">Blocked</option>}
            </select>

            <select
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 8px', fontSize: 12 }}
              onChange={(e) => handleBulkAssignee(e.target.value)}
              value=""
            >
              <option value="" disabled>Assign to</option>
              <option value="">Unassign</option>
              {projectMembers.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>

            <button type="button" className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <Trash2 />
              Delete
            </button>
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.key} className="task-list-group">
          {group.label && (
            <h4 className="task-list-group-heading">
              {group.label} <span className="task-list-group-count">{group.tasks.length}</span>
            </h4>
          )}
          <div className="task-list">
            {group.tasks.map((task) => (
              <TaskCard
                key={`${group.key}-${task.id}`}
                task={task}
                isSelected={selectedIds.includes(task.id)}
                onSelect={handleSelect}
                onClick={() => onTaskClick(task.id)}
                projectTasks={tasks}
              />
            ))}
          </div>
        </div>
      ))}

      {filteredTasks.length === 0 && (
        <div className="empty-state">
          <p>No tasks match these filters.</p>
        </div>
      )}
    </div>
  );
}
