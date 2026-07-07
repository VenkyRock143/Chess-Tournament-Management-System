const { pool } = require("../config/db");
const Tournament = require("../models/tournamentModel");
const { shuffle, buildPairings } = require("../utils/shuffle");

// Start tournament
exports.startTournament = async (req, res, next) => {
  const tournamentId = req.params.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Tournament already started
    if (tournament.status != "pending") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Tournament has already started",
      });
    }

    // Check player count
    const playerCount = await Tournament.getPlayerCount(client, tournamentId);

    if (playerCount != 10) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Exactly 10 players are required to start the tournament",
      });
    }

    // Change status to active
    await Tournament.setActive(client, tournamentId, 1);

    // Get all players
    const playerQuery =
      "SELECT player_id FROM tournament_players WHERE tournament_id = $1";

    const playerResult = await client.query(playerQuery, [tournamentId]);

    const playerIds = [];

    for (let i = 0; i < playerResult.rows.length; i++) {
      playerIds.push(playerResult.rows[i].player_id);
    }

    // Shuffle players
    const shuffledPlayers = shuffle(playerIds);

    // Create matches
    const pairings = buildPairings(shuffledPlayers);

    await Tournament.insertMatches(client, tournamentId, 1, pairings);

    await client.query("COMMIT");

    res.json({
      message: "Tournament started successfully. Round 1 is ready.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    next(error);
  } finally {
    client.release();
  }
};

// Complete current round
exports.completeRound = async (req, res, next) => {
  const tournamentId = req.params.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Tournament should be active
    if (tournament.status != "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Tournament is not active",
      });
    }

    const currentRound = tournament.current_round;

    // Get pending matches
    const pendingMatches = await Tournament.getPendingMatches(
      client,
      tournamentId,
      currentRound,
    );

    if (pendingMatches.length == 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "No pending matches found",
      });
    }

    // Complete every match
    for (let i = 0; i < pendingMatches.length; i++) {
      const match = pendingMatches[i];

      // Bye match
      if (match.is_bye) {
        await Tournament.setMatchCompleted(client, match.id, match.player1_id);

        await Tournament.incrementWins(client, tournamentId, match.player1_id);

        continue;
      }

      let winnerId;
      let loserId;

      // Random winner
      if (Math.random() < 0.5) {
        winnerId = match.player1_id;
        loserId = match.player2_id;
      } else {
        winnerId = match.player2_id;
        loserId = match.player1_id;
      }

      await Tournament.setMatchCompleted(client, match.id, winnerId);

      await Tournament.incrementWins(client, tournamentId, winnerId);

      await Tournament.disqualifyPlayer(client, tournamentId, loserId);
    }

    await client.query("COMMIT");

    res.json({
      message: "Round " + currentRound + " completed successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    next(error);
  } finally {
    client.release();
  }
};

// Start next round
exports.nextRound = async (req, res, next) => {
  const tournamentId = req.params.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Tournament should be active
    if (tournament.status != "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Tournament is not active",
      });
    }

    const currentRound = tournament.current_round;

    // Check pending matches
    const pendingMatches = await Tournament.getPendingMatches(
      client,
      tournamentId,
      currentRound,
    );

    if (pendingMatches.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Complete all matches before starting the next round",
      });
    }

    // Get active players
    const activePlayers = await Tournament.getActivePlayerIds(
      client,
      tournamentId,
    );

    // Tournament completed
    if (activePlayers.length <= 1) {
      await Tournament.setStatus(client, tournamentId, "completed");

      await client.query("COMMIT");

      return res.json({
        message: "Tournament completed successfully.",
        completed: true,
      });
    }

    // Increase round
    const nextRound = currentRound + 1;

    await Tournament.incrementRound(client, tournamentId, nextRound);

    // Shuffle players
    const shuffledPlayers = shuffle(activePlayers);

    let pairings;

    // Odd number of players left, instead of giving someone a free
    // bye, bring back the best performing eliminated player to fight
    // for the spot (wildcard entry)
    if (shuffledPlayers.length % 2 != 0) {
      const wildcardPlayerId = await Tournament.getTopEliminatedPlayer(
        client,
        tournamentId,
      );

      if (wildcardPlayerId) {
        // This player would have gotten the bye, now plays the wildcard
        const oddPlayerId = shuffledPlayers.pop();

        await Tournament.reactivatePlayer(
          client,
          tournamentId,
          wildcardPlayerId,
        );

        pairings = buildPairings(shuffledPlayers);

        pairings.push({
          player1Id: oddPlayerId,
          player2Id: wildcardPlayerId,
          isBye: false,
          isWildcard: true,
        });
      } else {
        // No eliminated player available to bring back, normal bye
        pairings = buildPairings(shuffledPlayers);
      }
    } else {
      pairings = buildPairings(shuffledPlayers);
    }

    // Insert matches
    await Tournament.insertMatches(client, tournamentId, nextRound, pairings);

    await client.query("COMMIT");

    res.json({
      message: "Round " + nextRound + " is ready.",
      round: nextRound,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    next(error);
  } finally {
    client.release();
  }
};
