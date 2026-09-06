import { Moon, Sun } from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';

export default function ThemeToggle({ className = '' }) {
  const [theme, toggleTheme] = useDarkMode();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : ''} ${className}`.trim()}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-track">
        <Sun className="theme-toggle-icon theme-toggle-icon-sun" />
        <Moon className="theme-toggle-icon theme-toggle-icon-moon" />
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}