const Tournament = require("../models/tournamentModel");

// Get tournament results
exports.getResults = async (req, res, next) => {
  const tournamentId = req.params.id;

  try {
    // Check tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Tournament should be completed
    if (tournament.status != "completed") {
      return res.status(400).json({
        error: "Tournament is not completed yet",
      });
    }

    // Get rankings
    const rankings = await Tournament.getRankedPlayers(tournamentId);

    let champion = null;
    let runnerUp = null;
    let thirdPlace = null;

    // Find champion
    for (let i = 0; i < rankings.length; i++) {
      if (rankings[i].status == "active") {
        champion = rankings[i];
        break;
      }
    }

    // If active player not found
    if (!champion && rankings.length > 0) {
      champion = rankings[0];
    }

    // Get final match
    const finalMatch = await Tournament.getFinalMatch(tournamentId);

    if (finalMatch) {
      let loserId;

      if (finalMatch.winner_id == finalMatch.player1_id) {
        loserId = finalMatch.player2_id;
      } else {
        loserId = finalMatch.player1_id;
      }

      // Find runner up
      for (let i = 0; i < rankings.length; i++) {
        if (rankings[i].player_id == loserId) {
          runnerUp = rankings[i];
          break;
        }
      }
    }

    // Find third place
    if (finalMatch && finalMatch.round > 1) {
      const semiFinalMatches = await Tournament.getMatchesByRound(
        tournamentId,
        finalMatch.round - 1,
      );

      const semiLosers = [];

      for (let i = 0; i < semiFinalMatches.length; i++) {
        const match = semiFinalMatches[i];

        if (match.winner_id == match.player1_id) {
          semiLosers.push(match.player2_id);
        } else {
          semiLosers.push(match.player1_id);
        }
      }

      const candidates = [];

      for (let i = 0; i < rankings.length; i++) {
        const player = rankings[i];

        if (
          semiLosers.includes(player.player_id) &&
          player.player_id != champion.player_id &&
          (!runnerUp || player.player_id != runnerUp.player_id)
        ) {
          candidates.push(player);
        }
      }

      if (candidates.length > 0) {
        thirdPlace = candidates[0];

        for (let i = 1; i < candidates.length; i++) {
          if (candidates[i].wins > thirdPlace.wins) {
            thirdPlace = candidates[i];
          }
        }
      }
    }

    res.json({
      tournament: tournament,

      rankings: rankings,

      podium: {
        first: champion,

        second: runnerUp,

        third: thirdPlace,
      },
    });
  } catch (error) {
    next(error);
  }
};
