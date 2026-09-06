import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, Check, Circle } from 'lucide-react';
import { toggleTaskComplete } from '../../store/tasksSlice';
import { canApproveDone } from '../../utils/permissions';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PRIORITY_CLASS = {
  low: 'calendar-priority-low',
  medium: 'calendar-priority-medium',
  high: 'calendar-priority-high',
  urgent: 'calendar-priority-urgent',
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function buildMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - leadingDays);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

export default function CalendarView({ tasks, onTaskClick }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const canComplete = canApproveDone(currentUser);
  const [monthCursor, setMonthCursor] = useState(new Date());

  const today = new Date();
  const days = buildMonthGrid(monthCursor);

  const tasksForDate = (date) =>
    tasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), date));

  const changeMonth = (amount) => {
    setMonthCursor(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + amount, 1)
    );
  };

  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const handleToggleComplete = (event, taskId) => {
    event.stopPropagation();
    if (!canComplete) return;
    dispatch(toggleTaskComplete(taskId));
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>

          <h2 className="calendar-month-label">{monthLabel}</h2>

          <button
            type="button"
            className="calendar-nav-btn"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setMonthCursor(new Date())}
        >
          Today
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayTasks = tasksForDate(day);
          const isCurrentMonth = day.getMonth() === monthCursor.getMonth();
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={[
                'calendar-cell',
                !isCurrentMonth && 'calendar-cell-outside',
                isToday && 'calendar-cell-today',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="calendar-cell-date">{day.getDate()}</span>

              <div className="calendar-cell-tasks">
                {dayTasks.slice(0, 3).map((task) => {
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      className={`calendar-task-event ${
                        PRIORITY_CLASS[task.priority] || 'calendar-priority-medium'
                      } ${isDone ? 'calendar-task-complete' : ''}`}
                      title={task.title}
                    >
                      <button
                        type="button"
                        className="calendar-task-complete-btn"
                        onClick={(event) => handleToggleComplete(event, task.id)}
                        disabled={!canComplete}
                        title={canComplete ? (isDone ? 'Mark as incomplete' : 'Mark as complete') : 'Access denied: only admins and owners can approve tasks'}
                        aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {isDone ? <Check /> : <Circle />}
                      </button>

                      <button
                        type="button"
                        className="calendar-task-title"
                        onClick={() => onTaskClick(task.id)}
                      >
                        {task.title}
                      </button>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <span className="calendar-more-hint">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
