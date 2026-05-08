// Base URL prefix for all API calls
// Vite proxies /api → http://localhost:5000 during development
const BASE = '/api';

// ── Core Request Helper ──────────────────────────────────
// All API calls go through this one function.
// It sets the Content-Type header, converts body to JSON,
// and throws a readable error if the response is not OK.
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  // If the backend returned an error status (4xx, 5xx), throw it
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ── Player API Calls ─────────────────────────────────────

// Fetch all players from the database
export const getPlayers = () =>
  request('/players');

// Create a new player — body: { name, email }
export const createPlayer = (body) =>
  request('/players', { method: 'POST', body: JSON.stringify(body) });

// Delete a player by their ID
export const deletePlayer = (id) =>
  request(`/players/${id}`, { method: 'DELETE' });

// ── Tournament API Calls ─────────────────────────────────

// Fetch all tournaments
export const getTournaments = () =>
  request('/tournaments');

// Create a new tournament — body: { name }
export const createTournament = (body) =>
  request('/tournaments', { method: 'POST', body: JSON.stringify(body) });

// Get one tournament with all its players and matches
export const getTournament = (id) =>
  request(`/tournaments/${id}`);

// Add a player to a tournament — sends player_id in the body
export const addPlayerToTournament = (id, player_id) =>
  request(`/tournaments/${id}/players`, {
    method: 'POST',
    body: JSON.stringify({ player_id }),
  });

// Remove a player from a tournament (only while pending)
export const removePlayerFromTournament = (id, playerId) =>
  request(`/tournaments/${id}/players/${playerId}`, { method: 'DELETE' });

// Start the tournament — generates Round 1 matches
export const startTournament = (id) =>
  request(`/tournaments/${id}/start`, { method: 'POST' });

// Randomly select winners for all matches in the current round
export const completeRound = (id) =>
  request(`/tournaments/${id}/complete-round`, { method: 'POST' });

// Generate the next round from the surviving winners
export const nextRound = (id) =>
  request(`/tournaments/${id}/next-round`, { method: 'POST' });

// Get final rankings and podium for a completed tournament
export const getTournamentResults = (id) =>
  request(`/tournaments/${id}/results`);