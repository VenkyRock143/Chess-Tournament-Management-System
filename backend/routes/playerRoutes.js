const express = require("express");

const playerController = require("../controllers/playerController");

const router = express.Router();

// Player routes
router.get("/", playerController.getAllPlayers);

router.post("/", playerController.createPlayer);

router.delete("/:id", playerController.deletePlayer);

module.exports = router;
