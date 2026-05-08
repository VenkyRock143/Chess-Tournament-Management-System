import { useState, useEffect } from 'react';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../api';

export default function Players() {
  const [players, setPlayers]     = useState([]);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  // ── Inline-edit state ────────────────────────────────
  // editId holds the player currently being edited (null = none)
  const [editId, setEditId]       = useState(null);
  const [editName, setEditName]   = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => { fetchPlayers(); }, []);

  async function fetchPlayers() {
    try {
      setPlayers(await getPlayers());
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Create ───────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim() || !email.trim()) return setError('Both name and email are required.');
    setLoading(true);
    try {
      await createPlayer({ name, email });
      setSuccess(`Player "${name}" added successfully!`);
      setName(''); setEmail('');
      fetchPlayers();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  // ── Open inline edit row ─────────────────────────────
  function startEdit(player) {
    setEditId(player.id);
    setEditName(player.name);
    setEditEmail(player.email);
    setError(''); setSuccess('');
  }

  function cancelEdit() { setEditId(null); }

  // ── Save edit ────────────────────────────────────────
  async function handleUpdate(id) {
    setError(''); setSuccess('');
    if (!editName.trim() || !editEmail.trim()) return setError('Name and email are required.');
    setEditLoading(true);
    try {
      await updatePlayer(id, { name: editName, email: editEmail });
      setSuccess('Player updated successfully!');
      setEditId(null);
      fetchPlayers();
    } catch (e) { setError(e.message); }
    finally { setEditLoading(false); }
  }

  // ── Delete ───────────────────────────────────────────
  async function handleDelete(id, playerName) {
    if (!confirm(`Delete "${playerName}"? This cannot be undone.`)) return;
    try {
      await deletePlayer(id);
      setSuccess('Player deleted.');
      if (editId === id) setEditId(null);
      fetchPlayers();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="page">
      <h2 className="page-title">👤 Player Management</h2>

      {/* ── Add Player Form ────────────────────────── */}
      <div className="card">
        <h3>Add New Player</h3>
        <form onSubmit={handleCreate} className="form-row">
          <input className="input" type="text" placeholder="Full Name"
            value={name} onChange={e => setName(e.target.value)} />
          <input className="input" type="email" placeholder="Email Address"
            value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : '+ Add Player'}
          </button>
        </form>
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
                <th>#</th><th>Name</th><th>Email</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                editId === player.id ? (
                  /* ── Inline edit row ── */
                  <tr key={player.id} className="edit-row">
                    <td>{index + 1}</td>
                    <td>
                      <input className="input input-sm" type="text"
                        value={editName} onChange={e => setEditName(e.target.value)} />
                    </td>
                    <td>
                      <input className="input input-sm" type="email"
                        value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                    </td>
                    <td>{new Date(player.created_at).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <button className="btn btn-primary btn-sm"
                        onClick={() => handleUpdate(player.id)} disabled={editLoading}>
                        {editLoading ? 'Saving...' : '✓ Save'}
                      </button>
                      <button className="btn btn-sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  /* ── Normal read row ── */
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td><strong>{player.name}</strong></td>
                    <td>{player.email}</td>
                    <td>{new Date(player.created_at).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => startEdit(player)}>
                        ✏ Edit
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(player.id, player.name)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}