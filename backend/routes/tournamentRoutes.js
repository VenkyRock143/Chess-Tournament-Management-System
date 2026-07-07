const express = require("express");

const tournamentController = require("../controllers/tournamentController");
const tournamentPlayerController = require("../controllers/tournamentPlayerController");
const tournamentMatchController = require("../controllers/tournamentMatchController");
const tournamentResultController = require("../controllers/tournamentResultController");

const router = express.Router();

// Tournament routes
router.get("/", tournamentController.getAllTournaments);

router.post("/", tournamentController.createTournament);

router.get("/:id", tournamentController.getTournamentById);

// Tournament player routes
router.post("/:id/players", tournamentPlayerController.addPlayer);

router.delete(
  "/:id/players/:playerId",
  tournamentPlayerController.removePlayer,
);

// Tournament match routes
router.post("/:id/start", tournamentMatchController.startTournament);

router.post("/:id/complete-round", tournamentMatchController.completeRound);

router.post("/:id/next-round", tournamentMatchController.nextRound);

// Tournament result route
router.get("/:id/results", tournamentResultController.getResults);

router.delete("/:id", tournamentController.deleteTournament);

module.exports = router;
