const { pool } = require("../config/db");

// Player Model
// All player-related database queries are written here.

class Player {
  // Get all players from database
  static async findAll() {
    const query = "SELECT * FROM players ORDER BY created_at DESC";

    const result = await pool.query(query);

    return result.rows;
  }

  // Add a new player
  static async create(playerData) {
    const name = playerData.name.trim();
    const email = playerData.email.trim().toLowerCase();

    const query =
      "INSERT INTO players (name, email) VALUES ($1, $2) RETURNING *";

    const values = [name, email];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  // Check if player is already added to any active tournament
  static async findActiveTournament(playerId) {
    const query = `
      SELECT t.name
      FROM tournament_players tp
      JOIN tournaments t
      ON tp.tournament_id = t.id
      WHERE tp.player_id = $1
      AND t.status != 'pending'
      LIMIT 1
    `;

    const result = await pool.query(query, [playerId]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  }

  // Delete player
  static async delete(id) {
    const query = "DELETE FROM players WHERE id = $1";

    await pool.query(query, [id]);
  }
}

module.exports = Player;
