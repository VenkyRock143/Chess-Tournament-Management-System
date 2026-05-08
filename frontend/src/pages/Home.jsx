// Link is used to navigate to other pages when buttons are clicked
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">

      {/* ── Hero Section ──────────────────────────────── */}
      <div className="hero">
        <div className="hero-icon">♟</div>
        <h1>Chess Tournament Manager</h1>
        <p>Manage players, run tournaments, track results — all in one place.</p>

        {/* Navigation buttons to the two main sections */}
        <div className="hero-actions">
          <Link to="/players"     className="btn btn-primary">Manage Players</Link>
          <Link to="/tournaments" className="btn btn-secondary">View Tournaments</Link>
        </div>
      </div>

      {/* ── Feature Cards ─────────────────────────────── */}
      <div className="features">

        <div className="feature-card">
          <span className="feature-icon">👤</span>
          <h3>Player Profiles</h3>
          <p>Create and store player profiles with name and email in PostgreSQL.</p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🏆</span>
          <h3>Tournament Brackets</h3>
          <p>Run multi-round tournaments for 10 players with automatic bracket generation.</p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🎲</span>
          <h3>Random Match Results</h3>
          <p>Winners are selected randomly each round, simulating real match outcomes.</p>
        </div>

        <div className="feature-card">
          <span className="feature-icon">🥇</span>
          <h3>Final Rankings</h3>
          <p>View 1st, 2nd, and 3rd place with full leaderboard and disqualification tracking.</p>
        </div>

      </div>
    </div>
  );
}