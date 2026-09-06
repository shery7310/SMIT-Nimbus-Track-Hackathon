import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { logout } from '../../store/authSlice';
import GlobalSearch from '../search/GlobalSearch';
import ThemeToggle from '../ThemeToggle';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="topbar">
      <GlobalSearch />

      <div className="topbar-actions">
        <ThemeToggle />

        <button type="button" className="topbar-icon-btn" title="Notifications (coming in Phase 10)">
          <Bell />
        </button>

        <div className="topbar-avatar-wrap" ref={wrapRef}>
          <button type="button" className="topbar-avatar" onClick={() => setMenuOpen((o) => !o)}>
            {initials}
          </button>
          {menuOpen && (
            <div className="topbar-avatar-dropdown">
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <User />
                Profile
              </Link>
              <button type="button" onClick={handleLogout}>
                <LogOut />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}