const Player = require("../models/playerModel");

// Get all players
exports.getAllPlayers = async (req, res, next) => {
  try {
    const players = await Player.findAll();

    res.json(players);
  } catch (error) {
    next(error);
  }
};

// Create new player
exports.createPlayer = async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;

  // Check required fields
  if (!name || !email) {
    return res.status(400).json({
      error: "Name and email are required",
    });
  }

  try {
    const playerData = {
      name: name,
      email: email,
    };

    const player = await Player.create(playerData);

    res.status(201).json(player);
  } catch (error) {
    // Duplicate email
    if (error.code === "23505") {
      return res.status(400).json({
        error: "A player with this email already exists",
      });
    }

    next(error);
  }
};

// Delete player
exports.deletePlayer = async (req, res, next) => {
  const id = req.params.id;

  try {
    const tournament = await Player.findActiveTournament(id);

    if (tournament) {
      return res.status(400).json({
        error: "Cannot delete player. Player is enrolled in " + tournament.name,
      });
    }

    await Player.delete(id);

    res.json({
      message: "Player deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
