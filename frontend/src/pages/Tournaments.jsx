import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getTournaments,
  createTournament,
  deleteTournament
} from "../api/tournamentApi";

import Badge from "../components/Badge";
import Alert from "../components/Alert";
import Loading from "../components/Loading";

import { formatDate } from "../utils/formatters";

export default function Tournaments() {

  const [tournaments, setTournaments] = useState([]);

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {

    loadTournaments();

  }, []);

  async function loadTournaments() {

    setLoading(true);

    try {

      const data = await getTournaments();

      setTournaments(data);

    } catch (err) {

      setError(err.message);

    }

    setLoading(false);

  }

  async function handleSubmit(event) {

    event.preventDefault();

    setError("");
    setMessage("");

    if (name.trim() === "") {

      setError("Please enter tournament name.");

      return;

    }

    try {

      setSaving(true);

      await createTournament({
        name
      });

      setMessage("Tournament created successfully.");

      setName("");

      loadTournaments();

    } catch (err) {

      setError(err.message);

    }

    setSaving(false);

  }

  async function handleDelete(id, tournamentName) {

    const confirmDelete = window.confirm(
      `Delete "${tournamentName}" ?`
    );

    if (!confirmDelete) {
      return;
    }

    try {

      await deleteTournament(id);

      setMessage("Tournament deleted successfully.");

      loadTournaments();

    } catch (err) {

      setError(err.message);

    }

  }

  return (

    <div className="page">

      <h2>Tournaments</h2>

      <div className="card">

        <h3>Create Tournament</h3>

        <form onSubmit={handleSubmit}>

          <input
            className="input"
            type="text"
            placeholder="Tournament Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Tournament"}
          </button>

        </form>

        {message && (

          <Alert type="success">

            {message}

          </Alert>

        )}

        {error && (

          <Alert type="error">

            {error}

          </Alert>

        )}

      </div>

      <div className="card">

        <h3>All Tournaments</h3>

        {loading ? (

          <Loading />

        ) : tournaments.length === 0 ? (

          <p>No tournaments found.</p>

        ) : (

          <table className="table">

            <thead>

              <tr>

                <th>#</th>

                <th>Name</th>

                <th>Status</th>

                <th>Created</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {tournaments.map((tournament, index) => (

                <tr key={tournament.id}>

                  <td>{index + 1}</td>

                  <td>{tournament.name}</td>

                  <td>

                    <Badge
                      status={tournament.status}
                    />

                  </td>

                  <td>

                    {formatDate(
                      tournament.created_at
                    )}

                  </td>

                  <td>

                    <Link
                      className="btn btn-secondary btn-sm"
                      to={`/tournaments/${tournament.id}`}
                    >
                      Open
                    </Link>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        handleDelete(
                          tournament.id,
                          tournament.name
                        )
                      }
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