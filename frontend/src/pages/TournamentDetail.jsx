import { useState, useEffect } from 'react';

// useParams reads the :id from the URL (e.g. /tournaments/3 → id = "3")
import { useParams, Link } from 'react-router-dom';

// Import every API call this page needs
import {
  getTournament,
  getPlayers,
  addPlayerToTournament,
  removePlayerFromTournament,
  startTournament,
  completeRound,
  nextRound,
  getTournamentResults,
} from '../api';

export default function TournamentDetail() {
  // ── Read the tournament ID from the URL ──────────────
  const { id } = useParams();

  // ── State ────────────────────────────────────────────
  const [data, setData]                   = useState(null);   // tournament + players + matches
  const [allPlayers, setAllPlayers]       = useState([]);     // all players in the DB
  const [selectedPlayer, setSelectedPlayer] = useState('');   // dropdown selection
  const [results, setResults]             = useState(null);   // podium data (completed only)
  const [msg, setMsg]                     = useState('');     // success message
  const [error, setError]                 = useState('');     // error message
  const [loading, setLoading]             = useState(false);  // button lock

  // ── Load Data on Mount ───────────────────────────────
  useEffect(() => {
    load();
    // Also load all players (needed for the "add player" dropdown)
    getPlayers().then(setAllPlayers).catch(() => {});
  }, [id]);

  // Fetch the full tournament state from the backend
  async function load() {
    try {
      const d = await getTournament(id);
      setData(d);
      // If tournament is done, also fetch the final rankings
      if (d.tournament.status === 'completed') {
        const r = await getTournamentResults(id);
        setResults(r);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Generic Action Handler ───────────────────────────
  // Wraps any API call: clears messages, shows loading, reloads data
  async function act(apiFn, fallbackMsg) {
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const res = await apiFn();
      setMsg(res.message || fallbackMsg);
      await load(); // Refresh page data after every action
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Add Player Handler ───────────────────────────────
  async function handleAddPlayer() {
    if (!selectedPlayer) return setError('Please select a player first.');
    await act(
      () => addPlayerToTournament(id, selectedPlayer),
      'Player added!'
    );
    setSelectedPlayer(''); // Reset dropdown after adding
  }

  // ── Loading State ────────────────────────────────────
  // Show a spinner until data arrives from the backend
  if (!data) {
    return <div className="page"><p className="loading">Loading tournament...</p></div>;
  }

  // ── Destructure Data ─────────────────────────────────
  const { tournament, players, matches } = data;

  // Build a Set of player IDs already in this tournament
  // Used to filter the dropdown so you can't add someone twice
  const addedIds = new Set(players.map(p => p.player_id));
  const availablePlayers = allPlayers.filter(p => !addedIds.has(p.id));

  // Get unique round numbers from matches, sorted ascending
  const roundNums = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

  // Check if there are any unfinished matches in the current round
  const pendingNow = matches.filter(
    m => m.round === tournament.current_round && m.status === 'pending'
  );

  // True when the current round is fully completed (used to show "Next Round" button)
  const roundDone = pendingNow.length === 0 && tournament.current_round > 0;

  // ── Render ───────────────────────────────────────────
  return (
    <div className="page">

      {/* Back link */}
      <div className="breadcrumb">
        <Link to="/tournaments">← Back to Tournaments</Link>
      </div>

      {/* Tournament title + status badge */}
      <div className="tournament-header">
        <h2>🏆 {tournament.name}</h2>
        <span className={`badge badge-${tournament.status}`}>
          {tournament.status}
        </span>
        {tournament.status === 'active' && (
          <span className="round-chip">Round {tournament.current_round}</span>
        )}
      </div>

      {/* Global feedback messages */}
      {msg   && <p className="alert alert-success">{msg}</p>}
      {error && <p className="alert alert-error">{error}</p>}


      {/* ══════════════════════════════════════════════
          SECTION A: Manage Players (shown only when pending)
          ══════════════════════════════════════════════ */}
      {tournament.status === 'pending' && (
        <div className="card">
          <h3>Players ({players.length} / 10)</h3>

          {/* Only show the dropdown if fewer than 10 players added */}
          {players.length < 10 && (
            <div className="form-row" style={{ marginBottom: '1rem' }}>
              <select
                className="input"
                value={selectedPlayer}
                onChange={e => setSelectedPlayer(e.target.value)}
              >
                <option value="">Select a player to add...</option>
                {availablePlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleAddPlayer}
                disabled={loading}
              >
                Add Player
              </button>
            </div>
          )}

          {/* Show enrolled players in a table */}
          {players.length === 0 ? (
            <p className="empty">No players yet. Add 10 to start the tournament.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.email}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          act(
                            () => removePlayerFromTournament(id, p.player_id),
                            'Player removed.'
                          )
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

          {/* Show start button only when exactly 10 players are added */}
          {players.length === 10 && (
            <div className="action-bar">
              <p className="hint">✅ 10 players ready. Start the tournament!</p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => act(() => startTournament(id), 'Tournament started!')}
                disabled={loading}
              >
                🚀 Start Tournament
              </button>
            </div>
          )}
        </div>
      )}


      {/* ══════════════════════════════════════════════
          SECTION B: Active Tournament — controls and match tables
          ══════════════════════════════════════════════ */}
      {tournament.status === 'active' && (
        <>
          {/* Round action buttons */}
          <div className="card">
            <div className="section-header">
              <h3>Round Controls</h3>
              <div className="btn-group">

                {/* Show "Auto-Select Winners" only if this round has pending matches */}
                {pendingNow.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={() => act(() => completeRound(id), 'Round completed!')}
                    disabled={loading}
                  >
                    🎲 Auto-Select Winners (Round {tournament.current_round})
                  </button>
                )}

                {/* Show "Generate Next Round" only after current round is fully done */}
                {roundDone && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => act(() => nextRound(id), 'Next round generated!')}
                    disabled={loading}
                  >
                    ⏭ Generate Next Round
                  </button>
                )}

              </div>
            </div>
          </div>

          {/* One table per round showing all matches */}
          {roundNums.map(round => {
            const roundMatches = matches.filter(m => m.round === round);
            return (
              <div className="card" key={round}>
                <h3>Round {round}</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Player 1</th>
                      <th style={{ textAlign: 'center' }}>vs</th>
                      <th>Player 2</th>
                      <th>Winner</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundMatches.map(m => (
                      <tr key={m.id}>
                        {/* Highlight the winner's cell in green */}
                        <td className={m.winner_id === m.player1_id ? 'winner-cell' : ''}>
                          {m.player1_name}
                        </td>
                        <td className="vs-cell">vs</td>
                        <td className={m.winner_id === m.player2_id ? 'winner-cell' : ''}>
                          {/* Show "BYE" instead of a name for bye matches */}
                          {m.is_bye ? <em>BYE</em> : m.player2_name}
                        </td>
                        <td>
                          {m.winner_name
                            ? <span className="winner-label">🏆 {m.winner_name}</span>
                            : '—'}
                        </td>
                        <td>
                          <span className={`badge ${m.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Live leaderboard showing wins, losses, and disqualification status */}
          <div className="card">
            <h3>Leaderboard</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Player</th><th>Wins</th><th>Losses</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr
                    key={p.id}
                    // Fade out disqualified players visually
                    className={p.status === 'disqualified' ? 'disqualified-row' : ''}
                  >
                    <td><strong>{p.name}</strong></td>
                    <td>{p.wins}</td>
                    <td>{p.losses}</td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-active' : 'badge-disqualified'}`}>
                        {p.status === 'active' ? 'Active' : '❌ Disqualified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}


      {/* ══════════════════════════════════════════════
          SECTION C: Completed Tournament — podium + full results
          ══════════════════════════════════════════════ */}
      {tournament.status === 'completed' && results && (
        <>
          {/* ── Trophy Podium ── */}
          <div className="card podium-card">
            <h3>🏅 Final Results</h3>
            <div className="podium">

              {/* 2nd place on the left */}
              {results.podium.second && (
                <div className="podium-step second">
                  <div className="podium-medal">🥈</div>
                  <div className="podium-name">{results.podium.second.name}</div>
                  <div className="podium-stats">
                    {results.podium.second.wins}W / {results.podium.second.losses}L
                  </div>
                  <div className="podium-rank">2nd Place</div>
                </div>
              )}

              {/* 1st place in the center (raised higher with CSS) */}
              {results.podium.first && (
                <div className="podium-step first">
                  <div className="podium-medal">🥇</div>
                  <div className="podium-name">{results.podium.first.name}</div>
                  <div className="podium-stats">
                    {results.podium.first.wins}W / {results.podium.first.losses}L
                  </div>
                  <div className="podium-rank">Champion 👑</div>
                </div>
              )}

              {/* 3rd place on the right */}
              {results.podium.third && (
                <div className="podium-step third">
                  <div className="podium-medal">🥉</div>
                  <div className="podium-name">{results.podium.third.name}</div>
                  <div className="podium-stats">
                    {results.podium.third.wins}W / {results.podium.third.losses}L
                  </div>
                  <div className="podium-rank">3rd Place</div>
                </div>
              )}

            </div>
          </div>

          {/* ── Full Rankings Table ── */}
          <div className="card">
            <h3>Full Rankings</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th><th>Player</th>
                  <th>Wins</th><th>Losses</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.rankings.map((p, i) => (
                  <tr
                    key={p.player_id}
                    className={p.status === 'disqualified' ? 'disqualified-row' : ''}
                  >
                    <td><strong>#{i + 1}</strong></td>
                    <td>{p.name}</td>
                    <td>{p.wins}</td>
                    <td>{p.losses}</td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-active' : 'badge-disqualified'}`}>
                        {p.status === 'active' ? '👑 Champion' : 'Disqualified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Match History (all rounds) ── */}
          {roundNums.map(round => {
            const roundMatches = matches.filter(m => m.round === round);
            return (
              <div className="card" key={round}>
                <h3>Round {round} — Match History</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Player 1</th><th>vs</th><th>Player 2</th><th>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundMatches.map(m => (
                      <tr key={m.id}>
                        <td className={m.winner_id === m.player1_id ? 'winner-cell' : ''}>
                          {m.player1_name}
                        </td>
                        <td className="vs-cell">vs</td>
                        <td className={m.winner_id === m.player2_id ? 'winner-cell' : ''}>
                          {m.is_bye ? 'BYE' : m.player2_name}
                        </td>
                        <td>{m.winner_name ? `🏆 ${m.winner_name}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}

    </div>
  );
}