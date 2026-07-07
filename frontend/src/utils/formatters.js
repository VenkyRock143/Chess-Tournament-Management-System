// Convert date into readable format

export function formatDate(date) {

  const newDate = new Date(date);

  return newDate.toLocaleDateString();

}

// Show round name (tournament is always 10 players so maxRound is always 4)

export function getRoundLabel(round, maxRound) {

  if (round === maxRound) {

    return "Final";

  }

  if (round === maxRound - 1) {

    return "Semi Final";

  }

  if (round === maxRound - 2) {

    return "Quarter Final";

  }

  return "Round " + round;

}