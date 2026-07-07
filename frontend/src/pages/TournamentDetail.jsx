import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getPlayers } from "../api/playerApi";

import useTournament from "../hooks/useTournament";

import Alert from "../components/Alert";
import Badge from "../components/Badge";
import Loading from "../components/Loading";
import Leaderboard from "../components/Leaderboard";
import MatchRound from "../components/MatchRound";
import Podium from "../components/Podium";

export default function TournamentDetail() {
  const { id } = useParams();

  const { tournament, players, matches, results, loading, error, actions } =
    useTournament(id);

  const [allPlayers, setAllPlayers] = useState([]);

  const [selectedPlayer, setSelectedPlayer] = useState("");

  const [message, setMessage] = useState("");

  const [actionError, setActionError] = useState("");

  const [working, setWorking] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    try {
      const data = await getPlayers();

      setAllPlayers(data);
    } catch (err) {
      console.log(err);
    }
  }

  async function doAction(callback) {
    setMessage("");
    setActionError("");

    try {
      setWorking(true);

      const result = await callback();

      if (result && result.message) {
        setMessage(result.message);
      }
    } catch (err) {
      setActionError(err.message);
    }

    setWorking(false);
  }

  async function handleAddPlayer() {
    if (selectedPlayer === "") {
      setActionError("Please select a player.");

      return;
    }

    await doAction(() => actions.addPlayer(Number(selectedPlayer)));

    setSelectedPlayer("");
  }

  if (loading) {
    return (
      <div className="page">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Alert type="error">{error}</Alert>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  const enrolledPlayers = players.map((player) => player.player_id);

  const availablePlayers = allPlayers.filter((player) => {
    return !enrolledPlayers.includes(player.id);
  });

  const rounds = [];

  matches.forEach((match) => {
    if (!rounds.includes(match.round)) {
      rounds.push(match.round);
    }
  });

  rounds.sort((a, b) => a - b);

  let maxRound = 0;

  if (rounds.length > 0) {
    maxRound = rounds[rounds.length - 1];
  }

  let pendingMatches = [];

  matches.forEach((match) => {
    if (
      match.round === tournament.current_round &&
      match.status === "pending"
    ) {
      pendingMatches.push(match);
    }
  });

  let currentRoundFinished = false;

  if (pendingMatches.length === 0) {
    currentRoundFinished = matches.some((match) => {
      return (
        match.round === tournament.current_round && match.status === "completed"
      );
    });
  }

  return (
    <div className="page">
      <Link to="/tournaments" className="back-link">
        ← Back to Tournaments
      </Link>
      <div className="card">
        <h2>{tournament.name}</h2>

        <div style={{ marginTop: "10px" }}>
          <Badge status={tournament.status} />

          {tournament.status === "active" && (
            <span className="round-info">Round {tournament.current_round}</span>
          )}
        </div>
      </div>
      {message && <Alert type="success">{message}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}
      {tournament.status === "pending" && (
        <div className="card">
          <h3>Players</h3>

          <p>{players.length} / 10 Players Added</p>

          {players.length < 10 && (
            <div>
              <select
                className="input"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
              >
                <option value="">Select Player</option>

                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.email})
                  </option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                onClick={handleAddPlayer}
                disabled={working}
              >
                Add Player
              </button>
            </div>
          )}

          {players.length === 0 ? (
            <p>No players added.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>

                  <th>Name</th>

                  <th>Email</th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {players.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>

                    <td>{player.name}</td>

                    <td>{player.email}</td>

                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={working}
                        onClick={() =>
                          doAction(() => actions.removePlayer(player.player_id))
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {players.length === 10 && (
            <div style={{ marginTop: "20px" }}>
              <button
                className="btn btn-primary"
                disabled={working}
                onClick={() => doAction(actions.start)}
              >
                Start Tournament
              </button>
            </div>
          )}
        </div>
      )}
      {tournament.status === "active" && (
        <>
          <div className="card">
            <h3>Round {tournament.current_round}</h3>

            {pendingMatches.length > 0 && (
              <button
                className="btn btn-primary"
                disabled={working}
                onClick={() => doAction(actions.completeRound)}
              >
                Complete Round
              </button>
            )}

            {currentRoundFinished && (
              <button
                className="btn btn-secondary"
                disabled={working}
                onClick={() => doAction(actions.nextRound)}
              >
                Generate Next Round
              </button>
            )}
          </div>

          {rounds.map((round) => (
            <MatchRound
              key={round}
              round={round}
              maxRound={maxRound}
              matches={matches}
            />
          ))}

          <Leaderboard players={players} />
        </>
      )}{" "}
      {tournament.status === "completed" && results && (
        <>
          <Podium podium={results.podium} />

          <div className="card">
            <h3>Final Rankings</h3>

            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>

                  <th>Player</th>

                  <th>Wins</th>

                  <th>Losses</th>

                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {results.rankings.map((player, index) => (
                  <tr key={player.player_id}>
                    <td>{index + 1}</td>

                    <td>{player.name}</td>

                    <td>{player.wins}</td>

                    <td>{player.losses}</td>

                    <td>
                      <Badge status={player.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Match History</h3>

            {rounds.map((round) => (
              <MatchRound
                key={round}
                round={round}
                maxRound={maxRound}
                matches={matches}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
