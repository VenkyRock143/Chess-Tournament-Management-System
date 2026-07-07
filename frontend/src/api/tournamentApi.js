import request from "./client";

// Get tournaments
async function getTournaments() {
  const data = await request("/tournaments");

  return data;
}

// Create tournament
async function createTournament(tournament) {
  const data = await request("/tournaments", {
    method: "POST",

    body: JSON.stringify(tournament),
  });

  return data;
}

// Get one tournament
async function getTournament(id) {
  const data = await request("/tournaments/" + id);

  return data;
}

// Add player
async function addPlayerToTournament(tournamentId, playerId) {
  const data = await request("/tournaments/" + tournamentId + "/players", {
    method: "POST",

    body: JSON.stringify({
      player_id: playerId,
    }),
  });

  return data;
}

// Remove player
async function removePlayerFromTournament(tournamentId, playerId) {
  const data = await request(
    "/tournaments/" + tournamentId + "/players/" + playerId,

    {
      method: "DELETE",
    },
  );

  return data;
}

// Start tournament
async function startTournament(id) {
  const data = await request(
    "/tournaments/" + id + "/start",

    {
      method: "POST",
    },
  );

  return data;
}

// Complete round
async function completeRound(id) {
  const data = await request(
    "/tournaments/" + id + "/complete-round",

    {
      method: "POST",
    },
  );

  return data;
}

// Next round
async function nextRound(id) {
  const data = await request(
    "/tournaments/" + id + "/next-round",

    {
      method: "POST",
    },
  );

  return data;
}

// Tournament results
async function getTournamentResults(id) {
  const data = await request("/tournaments/" + id + "/results");

  return data;
}

// Delete tournament
async function deleteTournament(id) {
  const data = await request(
    "/tournaments/" + id,

    {
      method: "DELETE",
    },
  );

  return data;
}

export {
  getTournaments,
  createTournament,
  getTournament,
  addPlayerToTournament,
  removePlayerFromTournament,
  startTournament,
  completeRound,
  nextRound,
  getTournamentResults,
  deleteTournament,
};
