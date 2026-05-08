import { useState, useEffect } from 'react';
import { getPlayers, createPlayer, deletePlayer } from '../api';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim() || !email.trim()) {
      return setError('Name and email are required.');
    }
    setLoading(true);
    try {
      await createPlayer({ name, email });
      setSuccess(`Player "${name}" created successfully!`);
      setName(''); setEmail('');
      fetchPlayers();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, playerName) {
    if (!confirm(`Delete player "${playerName}"?`)) return;
    try {
      await deletePlayer(id);
      setSuccess(`Player deleted.`);
      fetchPlayers();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="page">
      <h2 className="page-title">👤 Player Management</h2>

      <div className="card">
        <h3>Add New Player</h3>
        <form onSubmit={handleCreate} className="form-row">
          <input
            className="input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="input"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : '+ Add Player'}
          </button>
        </form>
        {error && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}
      </div>

      <div className="card">
        <h3>All Players ({players.length})</h3>
        {players.length === 0 ? (
          <p className="empty">No players yet. Add one above.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.email}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
