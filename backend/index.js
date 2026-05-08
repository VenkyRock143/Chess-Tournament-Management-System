require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const playersRouter = require('./routes/players');
const tournamentsRouter = require('./routes/tournaments');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/players', playersRouter);
app.use('/api/tournaments', tournamentsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
