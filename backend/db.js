require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`

      CREATE TABLE IF NOT EXISTS players (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        status        VARCHAR(20) DEFAULT 'pending',
        current_round INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tournament_players (
        id            SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        player_id     INTEGER REFERENCES players(id) ON DELETE CASCADE,
        status        VARCHAR(20) DEFAULT 'active',
        wins          INTEGER DEFAULT 0,
        losses        INTEGER DEFAULT 0,
        UNIQUE(tournament_id, player_id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id            SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round         INTEGER NOT NULL,
        player1_id    INTEGER REFERENCES players(id),
        player2_id    INTEGER REFERENCES players(id),
        winner_id     INTEGER REFERENCES players(id),
        is_bye        BOOLEAN DEFAULT FALSE,
        status        VARCHAR(20) DEFAULT 'pending',
        created_at    TIMESTAMP DEFAULT NOW()
      );

    `);
    console.log('Database tables ready.');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };