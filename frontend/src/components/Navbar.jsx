
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  // Get the current URL path (e.g. "/players")
  const { pathname } = useLocation();

  // Define all navigation links in one array — easy to add more later
  const links = [
    { to: '/',            label: '♟ Home' },
    { to: '/players',     label: '👤 Players' },
    { to: '/tournaments', label: '🏆 Tournaments' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">Chess Tournament Manager</div>
      <ul className="navbar-links">
        {links.map(link => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={pathname === link.to ? 'active' : ''}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}