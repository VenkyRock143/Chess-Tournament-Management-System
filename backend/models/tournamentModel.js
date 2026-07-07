const { pool } = require("../config/db");

// Tournament model
// All tournament related database queries are written here.

class Tournament {
  // Get all tournaments
  static async findAll() {
    const query = "SELECT * FROM tournaments ORDER BY created_at DESC";

    const result = await pool.query(query);

    return result.rows;
  }

  // Get tournament using id
  static async findById(id) {
    const query = "SELECT * FROM tournaments WHERE id = $1";

    const result = await pool.query(query, [id]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  }

  // Create new tournament
  static async create(data) {
    const name = data.name.trim();

    const query = "INSERT INTO tournaments (name) VALUES ($1) RETURNING *";

    const result = await pool.query(query, [name]);

    return result.rows[0];
  }

  // Get all players in tournament
  static async getPlayers(tournamentId) {
    const query = `
      SELECT tp.*, p.name, p.email
      FROM tournament_players tp
      JOIN players p
      ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY tp.wins DESC, tp.losses ASC
    `;

    const result = await pool.query(query, [tournamentId]);

    return result.rows;
  }

  // Count players
  static async getPlayerCount(client, tournamentId) {
    const query =
      "SELECT COUNT(*) FROM tournament_players WHERE tournament_id = $1";

    const result = await client.query(query, [tournamentId]);

    return Number(result.rows[0].count);
  }

  // Add player
  static async addPlayer(tournamentId, playerId) {
    const query = `
      INSERT INTO tournament_players
      (tournament_id, player_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(query, [tournamentId, playerId]);

    return result.rows[0];
  }

  // Remove player
  static async removePlayer(tournamentId, playerId) {
    const query =
      "DELETE FROM tournament_players WHERE tournament_id = $1 AND player_id = $2";

    await pool.query(query, [tournamentId, playerId]);
  }

  // Get all matches
  static async getMatches(tournamentId) {
    const query = `
      SELECT
      m.*,
      p1.name AS player1_name,
      p2.name AS player2_name,
      w.name AS winner_name
      FROM matches m
      LEFT JOIN players p1 ON p1.id = m.player1_id
      LEFT JOIN players p2 ON p2.id = m.player2_id
      LEFT JOIN players w ON w.id = m.winner_id
      WHERE m.tournament_id = $1
      ORDER BY m.round ASC, m.id ASC
    `;

    const result = await pool.query(query, [tournamentId]);

    return result.rows;
  }

  // Get pending matches
  static async getPendingMatches(client, tournamentId, round) {
    const query = `
      SELECT *
      FROM matches
      WHERE tournament_id = $1
      AND round = $2
      AND status = 'pending'
    `;

    const result = await client.query(query, [tournamentId, round]);

    return result.rows;
  }

  // Complete match
  static async setMatchCompleted(client, matchId, winnerId) {
    const query = `
      UPDATE matches
      SET winner_id = $1,
      status = 'completed'
      WHERE id = $2
    `;

    await client.query(query, [winnerId, matchId]);
  }

  // Insert new matches
  static async insertMatches(client, tournamentId, round, pairings) {
    for (let i = 0; i < pairings.length; i++) {
      const match = pairings[i];

      if (match.isBye) {
        const query = `
          INSERT INTO matches
          (tournament_id, round, player1_id, is_bye)
          VALUES ($1, $2, $3, TRUE)
        `;

        await client.query(query, [tournamentId, round, match.player1Id]);
      } else if (match.isWildcard) {
        const query = `
          INSERT INTO matches
          (tournament_id, round, player1_id, player2_id, is_wildcard)
          VALUES ($1, $2, $3, $4, TRUE)
        `;

        await client.query(query, [
          tournamentId,
          round,
          match.player1Id,
          match.player2Id,
        ]);
      } else {
        const query = `
          INSERT INTO matches
          (tournament_id, round, player1_id, player2_id)
          VALUES ($1, $2, $3, $4)
        `;

        await client.query(query, [
          tournamentId,
          round,
          match.player1Id,
          match.player2Id,
        ]);
      }
    }
  }

  // Increase wins
  static async incrementWins(client, tournamentId, playerId) {
    const query = `
      UPDATE tournament_players
      SET wins = wins + 1
      WHERE tournament_id = $1
      AND player_id = $2
    `;

    await client.query(query, [tournamentId, playerId]);
  }

  // Remove active status after losing
  static async disqualifyPlayer(client, tournamentId, playerId) {
    const query = `
      UPDATE tournament_players
      SET losses = losses + 1,
      status = 'disqualified'
      WHERE tournament_id = $1
      AND player_id = $2
    `;

    await client.query(query, [tournamentId, playerId]);
  }

  // Get best eliminated player who has not used wildcard yet
  static async getTopEliminatedPlayer(client, tournamentId) {
    const query = `
      SELECT player_id
      FROM tournament_players
      WHERE tournament_id = $1
      AND status = 'disqualified'
      AND wildcard_used = FALSE
      ORDER BY wins DESC, losses ASC, id ASC
      LIMIT 1
    `;

    const result = await client.query(query, [tournamentId]);

    if (result.rows.length > 0) {
      return result.rows[0].player_id;
    }

    return null;
  }

  // Bring an eliminated player back as a wildcard entry
  static async reactivatePlayer(client, tournamentId, playerId) {
    const query = `
      UPDATE tournament_players
      SET status = 'active',
      wildcard_used = TRUE
      WHERE tournament_id = $1
      AND player_id = $2
    `;

    await client.query(query, [tournamentId, playerId]);
  }

  // Get active players
  static async getActivePlayerIds(client, tournamentId) {
    const query = `
      SELECT player_id
      FROM tournament_players
      WHERE tournament_id = $1
      AND status = 'active'
      ORDER BY RANDOM()
    `;

    const result = await client.query(query, [tournamentId]);

    const players = [];

    for (let i = 0; i < result.rows.length; i++) {
      players.push(result.rows[i].player_id);
    }

    return players;
  }

  // Update tournament status
  static async setStatus(client, id, status) {
    const query = "UPDATE tournaments SET status = $1 WHERE id = $2";

    await client.query(query, [status, id]);
  }

  // Start tournament
  static async setActive(client, id, round) {
    const query = `
      UPDATE tournaments
      SET status = 'active',
      current_round = $1
      WHERE id = $2
    `;

    await client.query(query, [round, id]);
  }

  // Next round
  static async incrementRound(client, id, nextRound) {
    const query = "UPDATE tournaments SET current_round = $1 WHERE id = $2";

    await client.query(query, [nextRound, id]);
  }

  // Get ranking
  static async getRankedPlayers(tournamentId) {
    const query = `
      SELECT tp.*, p.name, p.email
      FROM tournament_players tp
      JOIN players p
      ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY tp.wins DESC, tp.losses ASC, tp.status ASC
    `;

    const result = await pool.query(query, [tournamentId]);

    return result.rows;
  }

  // Get final match
  static async getFinalMatch(tournamentId) {
    const query = `
      SELECT *
      FROM matches
      WHERE tournament_id = $1
      AND status = 'completed'
      AND is_bye = FALSE
      ORDER BY round DESC, id DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [tournamentId]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  }

  // Get matches by round
  static async getMatchesByRound(tournamentId, round) {
    const query = `
      SELECT *
      FROM matches
      WHERE tournament_id = $1
      AND round = $2
      AND status = 'completed'
      AND is_bye = FALSE
    `;

    const result = await pool.query(query, [tournamentId, round]);

    return result.rows;
  }

  static async delete(id) {
    const query = "DELETE FROM tournaments WHERE id = $1";

    await pool.query(query, [id]);
  }
}

module.exports = Tournament;
