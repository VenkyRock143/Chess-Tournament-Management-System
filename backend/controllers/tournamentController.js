const Tournament = require("../models/tournamentModel");

// Get all tournaments
exports.getAllTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.findAll();

    res.json(tournaments);
  } catch (error) {
    next(error);
  }
};

// Create tournament
exports.createTournament = async (req, res, next) => {
  const name = req.body.name;

  if (!name) {
    return res.status(400).json({
      error: "Tournament name is required",
    });
  }

  try {
    const tournamentData = {
      name: name,
    };

    const tournament = await Tournament.create(tournamentData);

    res.status(201).json(tournament);
  } catch (error) {
    next(error);
  }
};

// Get tournament by id
exports.getTournamentById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({
        error: "Tournament not found",
      });
    }

    // Get players
    const players = await Tournament.getPlayers(id);

    // Get matches
    const matches = await Tournament.getMatches(id);

    res.json({
      tournament: tournament,
      players: players,
      matches: matches,
    });
  } catch (error) {
    next(error);
  }
};

// Delete tournament
exports.deleteTournament = async function (req, res, next) {
  const id = req.params.id;

  try {
    await Tournament.delete(id);

    res.json({
      message: "Tournament deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
