import { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, SlidersHorizontal, X } from 'lucide-react';

const STORAGE_KEY = 'workspace_manager_filter_presets';
const EMPTY_FILTERS = { status: 'all', priority: 'all', assigneeId: 'all', label: 'all', dueFrom: '', dueTo: '' };

const loadPresets = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
};

export default function TaskFilters({ tasks, members, filters, onChange }) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState(loadPresets);
  const labels = useMemo(() => [...new Set(tasks.flatMap((task) => task.labels || []))].sort(), [tasks]);
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== 'status' && value && value !== 'all').length + (filters.status !== 'all' ? 1 : 0);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(presets)); }, [presets]);

  const change = (key, value) => onChange({ ...filters, [key]: value });
  const savePreset = () => {
    const name = window.prompt('Name this filter preset');
    if (!name?.trim()) return;
    setPresets((current) => [...current, { id: crypto.randomUUID(), name: name.trim(), filters }]);
  };

  return (
    <div className="phase5-filter-wrap">
      <button type="button" className={`btn btn-secondary btn-sm ${open ? 'active' : ''}`} onClick={() => setOpen((value) => !value)}>
        <SlidersHorizontal /> Filters{activeCount ? ` (${activeCount})` : ''}
      </button>
      {open && (
        <div className="phase5-filter-panel">
          <div className="phase5-filter-grid">
            <label>Status<select value={filters.status} onChange={(event) => change('status', event.target.value)}><option value="all">All statuses</option><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select></label>
            <label>Priority<select value={filters.priority} onChange={(event) => change('priority', event.target.value)}><option value="all">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label>Assignee<select value={filters.assigneeId} onChange={(event) => change('assigneeId', event.target.value)}><option value="all">Anyone</option><option value="unassigned">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}</select></label>
            <label>Label<select value={filters.label} onChange={(event) => change('label', event.target.value)}><option value="all">All labels</option>{labels.map((label) => <option key={label} value={label}>{label}</option>)}</select></label>
            <label>Due from<input type="date" value={filters.dueFrom} onChange={(event) => change('dueFrom', event.target.value)} /></label>
            <label>Due to<input type="date" value={filters.dueTo} onChange={(event) => change('dueTo', event.target.value)} /></label>
          </div>
          <div className="phase5-filter-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(EMPTY_FILTERS)}><X /> Clear</button><button type="button" className="btn btn-primary btn-sm" onClick={savePreset}><BookmarkPlus /> Save preset</button></div>
          {presets.length > 0 && <div className="phase5-presets"><span>Saved:</span>{presets.map((preset) => <button type="button" key={preset.id} onClick={() => onChange(preset.filters)}>{preset.name}</button>)}</div>}
        </div>
      )}
    </div>
  );
}

export { EMPTY_FILTERS };
