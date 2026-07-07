import request from "./client";

// Get all players
async function getPlayers() {
  const data = await request("/players");

  return data;
}

// Create player
async function createPlayer(player) {
  const data = await request("/players", {
    method: "POST",

    body: JSON.stringify(player),
  });

  return data;
}

// Delete player
async function deletePlayer(id) {
  const data = await request("/players/" + id, {
    method: "DELETE",
  });

  return data;
}

export { getPlayers, createPlayer, deletePlayer };
