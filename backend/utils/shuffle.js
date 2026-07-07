// Shuffle player list
function shuffle(playerList) {
  // Copy original array
  const shuffledPlayers = [];

  for (let i = 0; i < playerList.length; i++) {
    shuffledPlayers.push(playerList[i]);
  }

  // Shuffle players
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const temp = shuffledPlayers[i];

    shuffledPlayers[i] = shuffledPlayers[randomIndex];

    shuffledPlayers[randomIndex] = temp;
  }

  return shuffledPlayers;
}

// Create match pairings
function buildPairings(playerIds) {
  const pairings = [];

  for (let i = 0; i < playerIds.length; i = i + 2) {
    // Two players
    if (i + 1 < playerIds.length) {
      pairings.push({
        player1Id: playerIds[i],

        player2Id: playerIds[i + 1],

        isBye: false,
      });
    }

    // Only one player left
    else {
      pairings.push({
        player1Id: playerIds[i],

        player2Id: null,

        isBye: true,
      });
    }
  }

  return pairings;
}

module.exports = {
  shuffle,
  buildPairings,
};
