import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const links = [
    { to: '/', label: '♟ Home' },
    { to: '/players', label: '👤 Players' },
    { to: '/tournaments', label: '🏆 Tournaments' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">Chess Tournament Manager</div>
      <ul className="navbar-links">
        {links.map(l => (
          <li key={l.to}>
            <Link to={l.to} className={pathname === l.to ? 'active' : ''}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
