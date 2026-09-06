import { List, Columns3, CalendarDays } from 'lucide-react';

const VIEWS = [
  { id: 'list', label: 'List', icon: List },
  { id: 'board', label: 'Kanban', icon: Columns3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
];

export default function ViewSwitcher({ view, onChange }) {
  return (
    <div className="view-switcher">
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`view-switcher-btn ${view === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}