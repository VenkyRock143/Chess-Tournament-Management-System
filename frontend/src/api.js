const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Players
export const getPlayers = () => request('/players');
export const createPlayer = (body) => request('/players', { method: 'POST', body: JSON.stringify(body) });
export const deletePlayer = (id) => request(`/players/${id}`, { method: 'DELETE' });

// Tournaments
export const getTournaments = () => request('/tournaments');
export const createTournament = (body) => request('/tournaments', { method: 'POST', body: JSON.stringify(body) });
export const getTournament = (id) => request(`/tournaments/${id}`);
export const addPlayerToTournament = (id, player_id) =>
  request(`/tournaments/${id}/players`, { method: 'POST', body: JSON.stringify({ player_id }) });
export const removePlayerFromTournament = (id, playerId) =>
  request(`/tournaments/${id}/players/${playerId}`, { method: 'DELETE' });
export const startTournament = (id) =>
  request(`/tournaments/${id}/start`, { method: 'POST' });
export const completeRound = (id) =>
  request(`/tournaments/${id}/complete-round`, { method: 'POST' });
export const nextRound = (id) =>
  request(`/tournaments/${id}/next-round`, { method: 'POST' });
export const getTournamentResults = (id) =>
  request(`/tournaments/${id}/results`);
