import { useState } from "react";

import usePlayers from "../hooks/usePlayers";

import PlayerTable from "../components/PlayerTable";
import Alert from "../components/Alert";
import Loading from "../components/Loading";

export default function Players() {
  const { players, loading, error, addPlayer, removePlayer } = usePlayers();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setFormError("");

    if (name.trim() === "" || email.trim() === "") {
      setFormError("Please enter name and email.");
      return;
    }

    try {
      setSaving(true);

      await addPlayer({
        name,
        email,
      });

      setMessage("Player added successfully.");

      setName("");
      setEmail("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, playerName) {
    const confirmDelete = window.confirm(`Delete ${playerName}?`);

    if (!confirmDelete) {
      return;
    }

    try {
      await removePlayer(id);

      setMessage("Player deleted successfully.");
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="page">
      <h2>Players</h2>

      <div className="card">
        <h3>Add Player</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            placeholder="Player Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add Player"}
          </button>
        </form>

        {message && <Alert type="success">{message}</Alert>}

        {formError && <Alert type="error">{formError}</Alert>}
      </div>

      <div className="card">
        <h3>Player List</h3>

        {loading ? (
          <Loading />
        ) : (
          <PlayerTable players={players} onDelete={handleDelete} />
        )}

        {error && <Alert type="error">{error}</Alert>}
      </div>
    </div>
  );
}
