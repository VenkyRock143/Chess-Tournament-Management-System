require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { initDB } = require("./config/db");

const playerRoutes = require("./routes/playerRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");

const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

// Enable CORS
let allowedOrigin = true;

if (process.env.FRONTEND_URL) {
  allowedOrigin = process.env.FRONTEND_URL;
}

app.use(
  cors({
    origin: allowedOrigin,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Read JSON data
app.use(express.json());

// Player routes
app.use("/api/players", playerRoutes);

// Tournament routes
app.use("/api/tournaments", tournamentRoutes);

// Health check
app.get("/api/health", function (req, res) {
  res.json({
    status: "ok",
  });
});

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await initDB();

    app.listen(PORT, function () {
      console.log("Server is running on port " + PORT);
    });
  } catch (error) {
    console.log("Database connection failed.");

    console.log(error);

    process.exit(1);
  }
}

startServer();
