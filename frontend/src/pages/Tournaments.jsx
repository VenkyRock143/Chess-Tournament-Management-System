import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, createTournament } from '../api';

const STATUS_BADGE = {
  pending: { label: 'Pending', cls: 'badge-pending' },
  active: { label: 'Active', cls: 'badge-active' },
  completed: { label: 'Completed', cls: 'badge-completed' },
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    try {
      const data = await getTournaments();
      setTournaments(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim()) return setError('Tournament name is required.');
    setLoading(true);
    try {
      await createTournament({ name });
      setSuccess(`Tournament "${name}" created!`);
      setName('');
      fetchTournaments();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2 className="page-title">🏆 Tournaments</h2>

      <div className="card">
        <h3>Create New Tournament</h3>
        <form onSubmit={handleCreate} className="form-row">
          <input
            className="input"
            type="text"
            placeholder="Tournament Name (e.g. Spring Championship 2025)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : '+ Create'}
          </button>
        </form>
        {error && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}
      </div>

      <div className="card">
        <h3>All Tournaments ({tournaments.length})</h3>
        {tournaments.length === 0 ? (
          <p className="empty">No tournaments yet. Create one above.</p>
        ) : (
          <div className="tournament-list">
            {tournaments.map(t => {
              const badge = STATUS_BADGE[t.status] || STATUS_BADGE.pending;
              return (
                <div key={t.id} className="tournament-item">
                  <div className="tournament-info">
                    <h4>{t.name}</h4>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    {t.status === 'active' && (
                      <span className="round-info">Round {t.current_round}</span>
                    )}
                    <span className="date">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/tournaments/${t.id}`} className="btn btn-secondary btn-sm">
                    {t.status === 'completed' ? 'View Results' : 'Manage →'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
