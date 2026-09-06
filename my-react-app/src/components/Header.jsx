import { Link } from 'react-router-dom';
import NimbusCloudIcon from './NimbusCloudIcon';
import ThemeToggle from './ThemeToggle';

function Header() {
  return (
    <header className="auth-topbar">
      <Link to="/login" className="auth-brand">
        <span className="auth-brand-mark">
          <NimbusCloudIcon />
        </span>
        <span className="auth-brand-name">Nimbus Track</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

export default Header;
