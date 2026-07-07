const { pool } = require("../config/db");
const Tournament = require("../models/tournamentModel");

// Add player to tournament
exports.addPlayer = async (req, res, next) => {
  const tournamentId = req.params.id;
  const playerId = req.body.player_id;

  if (!playerId) {
    return res.status(400).json({
      error: "player_id is required",
    });
  }

  try {
    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Allow adding players only before tournament starts
    if (tournament.status != "pending") {
      return res.status(400).json({
        error: "Cannot add players after tournament has started",
      });
    }

    // Check player count
    const playerCount = await Tournament.getPlayerCount(pool, tournamentId);

    if (playerCount >= 10) {
      return res.status(400).json({
        error: "Tournament is already full. Maximum 10 players allowed.",
      });
    }

    // Add player
    const player = await Tournament.addPlayer(tournamentId, playerId);

    res.status(201).json(player);
  } catch (error) {
    // Duplicate player
    if (error.code == "23505") {
      return res.status(400).json({
        error: "Player is already added to this tournament",
      });
    }

    next(error);
  }
};

// Remove player from tournament
exports.removePlayer = async (req, res, next) => {
  const tournamentId = req.params.id;
  const playerId = req.params.playerId;

  try {
    // Check tournament
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Allow removing only before tournament starts
    if (tournament.status != "pending") {
      return res.status(400).json({
        error: "Cannot remove players after tournament has started",
      });
    }

    await Tournament.removePlayer(tournamentId, playerId);

    res.json({
      message: "Player removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
