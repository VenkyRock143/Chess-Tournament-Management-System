// useState stores data that changes (form inputs, player list, messages)
// useEffect runs code when the component first loads
import { useState, useEffect } from 'react';

// Import our API helper functions
import { getPlayers, createPlayer, deletePlayer } from '../api';

export default function Players() {
  // ── State Variables ──────────────────────────────────
  const [players, setPlayers]   = useState([]);   // list of all players from DB
  const [name, setName]         = useState('');   // controlled input for name field
  const [email, setEmail]       = useState('');   // controlled input for email field
  const [error, setError]       = useState('');   // error message to show user
  const [success, setSuccess]   = useState('');   // success message to show user
  const [loading, setLoading]   = useState(false);// prevents double-clicking submit

  // ── Load Players on Mount ────────────────────────────
  // useEffect with empty [] runs once when the component loads
  useEffect(() => {
    fetchPlayers();
  }, []);

  // Fetch all players from the backend and store in state
  async function fetchPlayers() {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Handle Create Player ─────────────────────────────
  async function handleCreate(e) {
    // Prevent the default browser form submission (page reload)
    e.preventDefault();

    // Clear previous messages
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (!name.trim() || !email.trim()) {
      return setError('Both name and email are required.');
    }

    setLoading(true);
    try {
      await createPlayer({ name, email });
      setSuccess(`Player "${name}" was added successfully!`);
      // Clear form fields after success
      setName('');
      setEmail('');
      // Refresh the players list
      fetchPlayers();
    } catch (e) {
      setError(e.message);
    } finally {
      // Always re-enable the button
      setLoading(false);
    }
  }

  // ── Handle Delete Player ─────────────────────────────
  async function handleDelete(id, playerName) {
    // Ask for confirmation before deleting
    if (!confirm(`Are you sure you want to delete "${playerName}"?`)) return;
    try {
      await deletePlayer(id);
      setSuccess('Player deleted.');
      fetchPlayers();
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="page">
      <h2 className="page-title">👤 Player Management</h2>

      {/* ── Add Player Form ────────────────────────── */}
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

        {/* Show error or success messages below the form */}
        {error   && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}
      </div>

      {/* ── Players Table ──────────────────────────── */}
      <div className="card">
        <h3>All Players ({players.length})</h3>

        {players.length === 0 ? (
          <p className="empty">No players yet. Use the form above to add one.</p>
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
              {players.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td><strong>{player.name}</strong></td>
                  <td>{player.email}</td>
                  {/* Format the timestamp into a readable date */}
                  <td>{new Date(player.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(player.id, player.name)}
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