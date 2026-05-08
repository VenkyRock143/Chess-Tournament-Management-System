const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tournament name is required' });
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

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

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
         p1.name AS player1_name,
         p2.name AS player2_name,
         w.name  AS winner_name
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

router.post('/:id/players', async (req, res) => {
  const { id } = req.params;
  const { player_id } = req.body;
  if (!player_id) return res.status(400).json({ error: 'player_id is required' });
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].status !== 'pending')
      return res.status(400).json({ error: 'Cannot add players after tournament starts' });

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM tournament_players WHERE tournament_id = $1', [id]
    );
    if (parseInt(countRes.rows[0].count) >= 10)
      return res.status(400).json({ error: 'Tournament already has 10 players' });

    const result = await pool.query(
      `INSERT INTO tournament_players (tournament_id, player_id)
       VALUES ($1, $2) RETURNING *`,
      [id, player_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'Player already in tournament' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/players/:playerId', async (req, res) => {
  const { id, playerId } = req.params;
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (tournament.rows[0].status !== 'pending')
      return res.status(400).json({ error: 'Cannot remove players after tournament starts' });
    await pool.query(
      'DELETE FROM tournament_players WHERE tournament_id = $1 AND player_id = $2',
      [id, playerId]
    );
    res.json({ message: 'Player removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/start', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tournament = await client.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].status !== 'pending')
      return res.status(400).json({ error: 'Tournament already started' });

    const countRes = await client.query(
      'SELECT COUNT(*) FROM tournament_players WHERE tournament_id = $1', [id]
    );
    if (parseInt(countRes.rows[0].count) !== 10)
      return res.status(400).json({ error: 'Exactly 10 players required to start' });

    await client.query(
      `UPDATE tournaments SET status = 'active', current_round = 1 WHERE id = $1`, [id]
    );

    const playersRes = await client.query(
      'SELECT player_id FROM tournament_players WHERE tournament_id = $1', [id]
    );
    const playerIds = shuffle(playersRes.rows.map(r => r.player_id));

    const inserts = [];
    for (let i = 0; i < playerIds.length; i += 2) {
      inserts.push(
        client.query(
          `INSERT INTO matches (tournament_id, round, player1_id, player2_id)
           VALUES ($1, 1, $2, $3)`,
          [id, playerIds[i], playerIds[i + 1]]
        )
      );
    }
    await Promise.all(inserts);

    await client.query('COMMIT');
    res.json({ message: 'Tournament started! Round 1 generated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/:id/complete-round', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tournament = await client.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].status !== 'active')
      return res.status(400).json({ error: 'Tournament is not active' });

    const { current_round } = tournament.rows[0];

    const pendingRes = await client.query(
      `SELECT * FROM matches
       WHERE tournament_id = $1 AND round = $2 AND status = 'pending'`,
      [id, current_round]
    );
    if (!pendingRes.rows.length)
      return res.status(400).json({ error: 'No pending matches in this round' });

    for (const match of pendingRes.rows) {
      let winnerId, loserId;

      if (match.is_bye) {
        winnerId = match.player1_id;
        loserId  = null;
      } else {
        const flip = Math.random() < 0.5;
        winnerId = flip ? match.player1_id : match.player2_id;
        loserId  = flip ? match.player2_id : match.player1_id;
      }

      await client.query(
        `UPDATE matches SET winner_id = $1, status = 'completed' WHERE id = $2`,
        [winnerId, match.id]
      );
      await client.query(
        `UPDATE tournament_players SET wins = wins + 1
         WHERE tournament_id = $1 AND player_id = $2`,
        [id, winnerId]
      );
      if (loserId) {
        await client.query(
          `UPDATE tournament_players SET losses = losses + 1, status = 'disqualified'
           WHERE tournament_id = $1 AND player_id = $2`,
          [id, loserId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: `Round ${current_round} completed with random winners.` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/:id/next-round', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tournament = await client.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.rows[0].status !== 'active')
      return res.status(400).json({ error: 'Tournament is not active' });

    const { current_round } = tournament.rows[0];

    const pending = await client.query(
      `SELECT COUNT(*) FROM matches
       WHERE tournament_id = $1 AND round = $2 AND status = 'pending'`,
      [id, current_round]
    );
    if (parseInt(pending.rows[0].count) > 0)
      return res.status(400).json({ error: 'Complete all matches before generating next round' });

    const nextRound = current_round + 1;

    // ── Fixed 4-round bracket: 10→8→4→2→1 player structure ──────────────
    // Round 1 (5 matches): all 10 play.
    // After Round 1: 5 winners advance automatically. To reach 8 players for
    // Round 2 (4 matches), 3 wild-card spots are granted to randomly chosen
    // losers from Round 1. The remaining 2 losers are disqualified.
    // Round 2 (4 matches): 8 players → 4 winners.
    // Round 3 (2 matches, semi-finals): 4 players → 2 winners.
    // Round 4 (1 match, final): 2 players → champion.

    if (current_round === 1) {
      // Get the 5 Round-1 winners (already marked 'active')
      const winnersRes = await client.query(
        `SELECT player_id FROM tournament_players
         WHERE tournament_id = $1 AND status = 'active'`,
        [id]
      );
      const winnerIds = winnersRes.rows.map(r => r.player_id);

      // Get the 5 Round-1 losers (marked 'disqualified' by complete-round)
      const losersRes = await client.query(
        `SELECT player_id FROM tournament_players
         WHERE tournament_id = $1 AND status = 'disqualified'
         ORDER BY RANDOM()`,
        [id]
      );
      const loserIds = losersRes.rows.map(r => r.player_id);

      // Give 3 wild-card spots to randomly selected losers
      const wildCards = loserIds.slice(0, 3);
      const eliminated = loserIds.slice(3); // remaining 2 stay disqualified

      // Re-activate the 3 wild-card players
      for (const pid of wildCards) {
        await client.query(
          `UPDATE tournament_players SET status = 'active'
           WHERE tournament_id = $1 AND player_id = $2`,
          [id, pid]
        );
      }
      // Keep the 2 eliminated players disqualified (no change needed)
      // Confirm the 2 eliminated are still disqualified
      for (const pid of eliminated) {
        await client.query(
          `UPDATE tournament_players SET status = 'disqualified'
           WHERE tournament_id = $1 AND player_id = $2`,
          [id, pid]
        );
      }

      // Build Round 2 with all 8 active players (5 winners + 3 wild-cards)
      const round2Players = shuffle([...winnerIds, ...wildCards]);
      await client.query(
        'UPDATE tournaments SET current_round = $1 WHERE id = $2',
        [nextRound, id]
      );

      const inserts = [];
      for (let i = 0; i < round2Players.length; i += 2) {
        inserts.push(
          client.query(
            `INSERT INTO matches (tournament_id, round, player1_id, player2_id)
             VALUES ($1, $2, $3, $4)`,
            [id, nextRound, round2Players[i], round2Players[i + 1]]
          )
        );
      }
      await Promise.all(inserts);

      await client.query('COMMIT');
      return res.json({
        message: `Round 2 generated! 5 winners + 3 wild-card players advance (${eliminated.length} eliminated).`,
      });
    }

    // Rounds 2, 3, 4: strict single-elimination from here
    const activeRes = await client.query(
      `SELECT player_id FROM tournament_players
       WHERE tournament_id = $1 AND status = 'active'`,
      [id]
    );
    const active = activeRes.rows.map(r => r.player_id);

    if (active.length <= 1) {
      await client.query(
        `UPDATE tournaments SET status = 'completed' WHERE id = $1`, [id]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Tournament complete! Check results.', completed: true });
    }

    await client.query(
      'UPDATE tournaments SET current_round = $1 WHERE id = $2',
      [nextRound, id]
    );

    const shuffled = shuffle(active);
    const inserts = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      inserts.push(
        client.query(
          `INSERT INTO matches (tournament_id, round, player1_id, player2_id)
           VALUES ($1, $2, $3, $4)`,
          [id, nextRound, shuffled[i], shuffled[i + 1]]
        )
      );
    }
    await Promise.all(inserts);

    await client.query('COMMIT');
    res.json({ message: `Round ${nextRound} generated!` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/:id/results', async (req, res) => {
  const { id } = req.params;
  try {
    const tournament = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1', [id]
    );
    if (!tournament.rows.length)
      return res.status(404).json({ error: 'Tournament not found' });

    const players = await pool.query(
      `SELECT tp.*, p.name, p.email
       FROM tournament_players tp
       JOIN players p ON p.id = tp.player_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.wins DESC, tp.losses ASC`,
      [id]
    );
    const rows = players.rows;

    const champion = rows.find(p => p.status === 'active') || rows[0];

    const finalRound = tournament.rows[0].current_round;
    const finalMatchRes = await pool.query(
      `SELECT * FROM matches
       WHERE tournament_id = $1 AND round = $2
         AND status = 'completed' AND is_bye = FALSE`,
      [id, finalRound]
    );

    let runnerUp = null;
    if (finalMatchRes.rows.length) {
      const last = finalMatchRes.rows[finalMatchRes.rows.length - 1];
      const loserId =
        last.winner_id === last.player1_id ? last.player2_id : last.player1_id;
      runnerUp = rows.find(p => p.player_id === loserId);
    }

    let thirdPlace = null;
    if (finalRound > 1) {
      const semiRes = await pool.query(
        `SELECT * FROM matches
         WHERE tournament_id = $1 AND round = $2
           AND status = 'completed' AND is_bye = FALSE`,
        [id, finalRound - 1]
      );
      const semiLosers = semiRes.rows.map(m =>
        m.winner_id === m.player1_id ? m.player2_id : m.player1_id
      );
      const candidates = rows.filter(p => semiLosers.includes(p.player_id));
      if (candidates.length) {
        thirdPlace = candidates.sort((a, b) => b.wins - a.wins)[0];
      }
    }

    res.json({
      tournament: tournament.rows[0],
      rankings: rows,
      podium: { first: champion || null, second: runnerUp || null, third: thirdPlace || null },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;