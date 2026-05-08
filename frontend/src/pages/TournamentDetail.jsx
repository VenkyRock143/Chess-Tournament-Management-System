import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [results, setResults] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
    getPlayers().then(setAllPlayers).catch(() => {});
  }, [id]);

  async function load() {
    try {
      const d = await getTournament(id);
      setData(d);
      if (d.tournament.status === 'completed') {
        const r = await getTournamentResults(id);
        setResults(r);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function act(fn, successMsg) {
    setMsg(''); setError('');
    setLoading(true);
    try {
      const res = await fn();
      setMsg(res.message || successMsg);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPlayer() {
    if (!selectedPlayer) return setError('Select a player first.');
    await act(() => addPlayerToTournament(id, selectedPlayer), 'Player added!');
    setSelectedPlayer('');
  }

  async function handleRemovePlayer(playerId) {
    await act(() => removePlayerFromTournament(id, playerId), 'Player removed.');
  }

  if (!data) return <div className="page"><p className="loading">Loading...</p></div>;

  const { tournament, players, matches } = data;
  const addedIds = new Set(players.map(p => p.player_id));
  const availablePlayers = allPlayers.filter(p => !addedIds.has(p.id));

  const roundNums = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
  const maxRound = roundNums.length > 0 ? Math.max(...roundNums) : 0;

  function getRoundLabel(round) {
    if (round === maxRound && maxRound > 1) return `Round ${round} — 🏆 Final`;
    if (round === maxRound - 1 && maxRound > 2) return `Round ${round} — Semi-Finals`;
    if (round === maxRound - 2 && maxRound > 3) return `Round ${round} — Quarter-Finals`;
    return `Round ${round}`;
  }

  const pendingInCurrentRound = matches.filter(
    m => m.round === tournament.current_round && m.status === 'pending'
  );
  const completedInCurrentRound = matches.filter(
    m => m.round === tournament.current_round && m.status === 'completed'
  );
  const allCompletedInCurrentRound =
    pendingInCurrentRound.length === 0 &&
    completedInCurrentRound.length > 0 &&
    tournament.current_round > 0;

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/tournaments">← Back to Tournaments</Link>
      </div>

      <div className="tournament-header">
        <h2>🏆 {tournament.name}</h2>
        <span className={`badge badge-${tournament.status}`}>{tournament.status}</span>
        {tournament.status === 'active' && (
          <span className="round-chip">Round {tournament.current_round}</span>
        )}
      </div>

      {msg && <p className="alert alert-success">{msg}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {/* PLAYER MANAGEMENT — only when pending */}
      {tournament.status === 'pending' && (
        <div className="card">
          <h3>Players ({players.length}/10)</h3>

          {players.length < 10 && (
            <div className="form-row" style={{ marginBottom: '1rem' }}>
              <select
                className="input"
                value={selectedPlayer}
                onChange={e => setSelectedPlayer(e.target.value)}
              >
                <option value="">Select a player to add...</option>
                {availablePlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={handleAddPlayer} disabled={loading}>
                Add Player
              </button>
            </div>
          )}

          {players.length === 0 ? (
            <p className="empty">No players added yet. Add at least 10 to start.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th></th></tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.email}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemovePlayer(p.player_id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {players.length === 10 && (
            <div className="action-bar">
              <p className="hint">✅ 10 players ready. You can now start the tournament!</p>
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

      {/* ACTIVE TOURNAMENT — show matches and controls */}
      {tournament.status === 'active' && (
        <>
          <div className="card">
            <div className="section-header">
              <h3>Round Controls</h3>
              <div className="btn-group">
                {pendingInCurrentRound.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={() => act(() => completeRound(id), 'Round completed!')}
                    disabled={loading}
                  >
                    🎲 Auto-Select Winners (Round {tournament.current_round})
                  </button>
                )}
                {allCompletedInCurrentRound && (
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

          {/* Matches by round */}
          {roundNums.map(round => {
            const roundMatches = matches.filter(m => m.round === round);
            return (
              <div className="card" key={round}>
                <h3>{getRoundLabel(round)}</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Player 1</th>
                      <th>vs</th>
                      <th>Player 2</th>
                      <th>Winner</th>
                      <th>Status</th>
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

          {/* Leaderboard */}
          <div className="card">
            <h3>Leaderboard</h3>
            <table className="table">
              <thead>
                <tr><th>Player</th><th>Wins</th><th>Losses</th><th>Status</th></tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id} className={p.status === 'disqualified' ? 'disqualified-row' : ''}>
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

      {/* COMPLETED TOURNAMENT — show podium */}
      {tournament.status === 'completed' && results && (
        <>
          <div className="card podium-card">
            <h3>🏅 Final Results</h3>
            <div className="podium">
              {results.podium.second && (
                <div className="podium-step second">
                  <div className="podium-medal">🥈</div>
                  <div className="podium-name">{results.podium.second.name}</div>
                  <div className="podium-stats">{results.podium.second.wins}W / {results.podium.second.losses}L</div>
                  <div className="podium-rank">2nd Place</div>
                </div>
              )}
              {results.podium.first && (
                <div className="podium-step first">
                  <div className="podium-medal">🥇</div>
                  <div className="podium-name">{results.podium.first.name}</div>
                  <div className="podium-stats">{results.podium.first.wins}W / {results.podium.first.losses}L</div>
                  <div className="podium-rank">Champion 👑</div>
                </div>
              )}
              {results.podium.third && (
                <div className="podium-step third">
                  <div className="podium-medal">🥉</div>
                  <div className="podium-name">{results.podium.third.name}</div>
                  <div className="podium-stats">{results.podium.third.wins}W / {results.podium.third.losses}L</div>
                  <div className="podium-rank">3rd Place</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Full Rankings</h3>
            <table className="table">
              <thead>
                <tr><th>Rank</th><th>Player</th><th>Wins</th><th>Losses</th><th>Status</th></tr>
              </thead>
              <tbody>
                {results.rankings.map((p, i) => (
                  <tr key={p.player_id} className={p.status === 'disqualified' ? 'disqualified-row' : ''}>
                    <td><strong>#{i + 1}</strong></td>
                    <td>{p.name}</td>
                    <td>{p.wins}</td>
                    <td>{p.losses}</td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-active' : 'badge-disqualified'}`}>
                        {p.status === 'active' ? 'Champion' : 'Disqualified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Match History */}
          {roundNums.map(round => {
            const roundMatches = matches.filter(m => m.round === round);
            return (
              <div className="card" key={round}>
                <h3>{getRoundLabel(round)} — Match History</h3>
                <table className="table">
                  <thead>
                    <tr><th>Player 1</th><th>vs</th><th>Player 2</th><th>Winner</th></tr>
                  </thead>
                  <tbody>
                    {roundMatches.map(m => (
                      <tr key={m.id}>
                        <td className={m.winner_id === m.player1_id ? 'winner-cell' : ''}>{m.player1_name}</td>
                        <td className="vs-cell">vs</td>
                        <td className={m.winner_id === m.player2_id ? 'winner-cell' : ''}>{m.is_bye ? 'BYE' : m.player2_name}</td>
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
