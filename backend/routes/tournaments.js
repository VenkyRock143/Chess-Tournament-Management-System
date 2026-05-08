const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Helper: shuffle array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tournaments ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create tournament
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tournament name required' });
  try {
    const result = await pool.query(
      'INSERT INTO tournaments (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tournament by ID (with players and matches)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (!tournament.rows.length) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const players = await pool.query(
      `SELECT tp.*, p.name, p.email
       FROM tournament_players tp
       JOIN players p ON p.id = tp.player_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.wins DESC, tp.losses ASC`,
      [id]
    );

    const matches = await pool.query(
      `SELECT m.*,
         p1.name as player1_name,
         p2.name as player2_name,
         w.name as winner_name
       FROM matches m
       LEFT JOIN players p1 ON p1.id = m.player1_id
       LEFT JOIN players p2 ON p2.id = m.player2_id
       LEFT JOIN players w  ON w.id  = m.winner_id
       WHERE m.tournament_id = $1
       ORDER BY m.round ASC, m.id ASC`,
      [id]
    );

    res.json({
      tournament: tournament.rows[0],
      players: players.rows,
      matches: matches.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add player to tournament
router.post('/:id/players', async (req, res) => {
  const { id } = req.params;
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: 'player_id required' });

  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

    if (tournament.rows[0].status !== 'pending')
      return res.status(400).json({ error: 'Tournament already started' });

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM tournament_players WHERE tournament_id = $1',
      [id]
    );
    if (parseInt(countRes.rows[0].count) >= 10)
      return res.status(400).json({ error: 'Tournament already has 10 players' });

    const result = await pool.query(
      `INSERT INTO tournament_players (tournament_id, player_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, player_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'Player already in tournament' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE player from tournament
router.delete('/:id/players/:playerId', async (req, res) => {
  const { id, playerId } = req.params;
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (tournament.rows[0].status !== 'pending')
      return res.status(400).json({ error: 'Cannot remove player after tournament starts' });

    await pool.query(
      'DELETE FROM tournament_players WHERE tournament_id = $1 AND player_id = $2',
      [id, playerId]
    );
    res.json({ message: 'Player removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST start tournament & generate Round 1
router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tournament = await client.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

    if (tournament.rows[0].status !== 'pending')
      return res.status(400).json({ error: 'Tournament already started' });

    const playerCount = await client.query(
      'SELECT COUNT(*) FROM tournament_players WHERE tournament_id = $1',
      [id]
    );
    if (parseInt(playerCount.rows[0].count) !== 10)
      return res.status(400).json({ error: 'Exactly 10 players required to start' });

    // Update tournament status
    await client.query(
      "UPDATE tournaments SET status = 'active', current_round = 1 WHERE id = $1",
      [id]
    );

    // Get all player IDs and shuffle
    const playersRes = await client.query(
      'SELECT player_id FROM tournament_players WHERE tournament_id = $1',
      [id]
    );
    const playerIds = shuffle(playersRes.rows.map(r => r.player_id));

    // Generate Round 1: 5 matches for 10 players
    const matchInserts = [];
    for (let i = 0; i < playerIds.length; i += 2) {
      matchInserts.push(
        client.query(
          `INSERT INTO matches (tournament_id, round, player1_id, player2_id)
           VALUES ($1, $2, $3, $4)`,
          [id, 1, playerIds[i], playerIds[i + 1]]
        )
      );
    }
    await Promise.all(matchInserts);

    await client.query('COMMIT');
    res.json({ message: 'Tournament started! Round 1 generated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST complete all pending matches in current round (random winners)
router.post('/:id/complete-round', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tournament = await client.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

    const { status, current_round } = tournament.rows[0];
    if (status !== 'active')
      return res.status(400).json({ error: 'Tournament is not active' });

    // Get pending matches this round
    const pendingRes = await client.query(
      `SELECT * FROM matches
       WHERE tournament_id = $1 AND round = $2 AND status = 'pending'`,
      [id, current_round]
    );

    if (!pendingRes.rows.length)
      return res.status(400).json({ error: 'No pending matches in current round' });

    for (const match of pendingRes.rows) {
      let winnerId, loserId;

      if (match.is_bye) {
        // Bye match — player1 auto-advances, no loser
        winnerId = match.player1_id;
        loserId = null;
      } else {
        // Randomly select winner between player1 and player2
        const coinFlip = Math.random() < 0.5;
        winnerId = coinFlip ? match.player1_id : match.player2_id;
        loserId = coinFlip ? match.player2_id : match.player1_id;
      }

      // Mark match completed
      await client.query(
        `UPDATE matches SET winner_id = $1, status = 'completed'
         WHERE id = $2`,
        [winnerId, match.id]
      );

      // Update winner's wins
      await client.query(
        `UPDATE tournament_players
         SET wins = wins + 1
         WHERE tournament_id = $1 AND player_id = $2`,
        [id, winnerId]
      );

      // Update loser's losses and disqualify them
      if (loserId) {
        await client.query(
          `UPDATE tournament_players
           SET losses = losses + 1, status = 'disqualified'
           WHERE tournament_id = $1 AND player_id = $2`,
          [id, loserId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: `Round ${current_round} completed with random winners selected.` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST generate next round
router.post('/:id/next-round', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tournament = await client.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

    const { status, current_round } = tournament.rows[0];
    if (status !== 'active')
      return res.status(400).json({ error: 'Tournament is not active' });

    // Ensure all matches in current round are completed
    const pendingCheck = await client.query(
      `SELECT COUNT(*) FROM matches
       WHERE tournament_id = $1 AND round = $2 AND status = 'pending'`,
      [id, current_round]
    );
    if (parseInt(pendingCheck.rows[0].count) > 0)
      return res.status(400).json({ error: 'Complete all matches before generating next round' });

    // Get active players (not disqualified)
    const activeRes = await client.query(
      `SELECT player_id FROM tournament_players
       WHERE tournament_id = $1 AND status = 'active'
       ORDER BY RANDOM()`,
      [id]
    );
    const activePlayers = activeRes.rows.map(r => r.player_id);

    if (activePlayers.length <= 1) {
      // Tournament is over
      await client.query(
        "UPDATE tournaments SET status = 'completed' WHERE id = $1",
        [id]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Tournament completed! Check results.', completed: true });
    }

    const nextRound = current_round + 1;
    await client.query(
      'UPDATE tournaments SET current_round = $1 WHERE id = $2',
      [nextRound, id]
    );

    const shuffled = shuffle(activePlayers);
    const matchInserts = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        // Normal match
        matchInserts.push(
          client.query(
            `INSERT INTO matches (tournament_id, round, player1_id, player2_id)
             VALUES ($1, $2, $3, $4)`,
            [id, nextRound, shuffled[i], shuffled[i + 1]]
          )
        );
      } else {
        // Odd player out — bye match
        matchInserts.push(
          client.query(
            `INSERT INTO matches (tournament_id, round, player1_id, is_bye)
             VALUES ($1, $2, $3, TRUE)`,
            [id, nextRound, shuffled[i]]
          )
        );
      }
    }

    await Promise.all(matchInserts);
    await client.query('COMMIT');
    res.json({ message: `Round ${nextRound} generated!`, round: nextRound });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET tournament results / rankings
router.get('/:id/results', async (req, res) => {
  const { id } = req.params;
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

    if (tournament.rows[0].status !== 'completed')
      return res.status(400).json({ error: 'Tournament is not completed yet' });

    // All players ranked by wins desc, losses asc
    const players = await pool.query(
      `SELECT tp.*, p.name, p.email
       FROM tournament_players tp
       JOIN players p ON p.id = tp.player_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.wins DESC, tp.losses ASC, tp.status ASC`,
      [id]
    );

    const rows = players.rows;

    // Champion: the one remaining active player
    const champion = rows.find(p => p.status === 'active') || rows[0];

    // Find the actual final match (last completed non-bye match in the highest round)
    const finalMatchRes = await pool.query(
      `SELECT * FROM matches
       WHERE tournament_id = $1 AND status = 'completed' AND is_bye = FALSE
       ORDER BY round DESC, id DESC
       LIMIT 1`,
      [id]
    );

    let runnerUp = null;
    if (finalMatchRes.rows.length) {
      const finalMatch = finalMatchRes.rows[0];
      const loserId =
        finalMatch.winner_id === finalMatch.player1_id
          ? finalMatch.player2_id
          : finalMatch.player1_id;
      runnerUp = rows.find(p => p.player_id === loserId) || null;
    }

    // Third place: find all semi-final losers (round before the final match round)
    let thirdPlace = null;
    if (finalMatchRes.rows.length) {
      const finalRound = finalMatchRes.rows[0].round;
      if (finalRound > 1) {
        const semiMatches = await pool.query(
          `SELECT * FROM matches
           WHERE tournament_id = $1 AND round = $2 AND status = 'completed' AND is_bye = FALSE`,
          [id, finalRound - 1]
        );
        const semiLosers = semiMatches.rows.map(m =>
          m.winner_id === m.player1_id ? m.player2_id : m.player1_id
        );
        // Exclude champion and runner-up; pick the one with most wins
        const candidates = rows.filter(
          p =>
            semiLosers.includes(p.player_id) &&
            p.player_id !== champion?.player_id &&
            p.player_id !== runnerUp?.player_id
        );
        if (candidates.length) {
          thirdPlace = candidates.sort((a, b) => b.wins - a.wins)[0];
        }
      }
    }

    res.json({
      tournament: tournament.rows[0],
      rankings: rows,
      podium: {
        first: champion || null,
        second: runnerUp || null,
        third: thirdPlace || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
