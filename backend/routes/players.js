const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all players
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM players ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create player
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO players (name, email) VALUES ($1, $2) RETURNING *',
      [name.trim(), email.trim().toLowerCase()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE player
router.delete('/:id', async (req, res) => {
  try {
    // Prevent deletion if player is part of any non-pending tournament
    const activeCheck = await pool.query(
      `SELECT t.name FROM tournament_players tp
       JOIN tournaments t ON t.id = tp.tournament_id
       WHERE tp.player_id = $1 AND t.status != 'pending'
       LIMIT 1`,
      [req.params.id]
    );
    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: `Cannot delete player: they are part of an active or completed tournament ("${activeCheck.rows[0].name}").`,
      });
    }
    await pool.query('DELETE FROM players WHERE id = $1', [req.params.id]);
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
