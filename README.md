# ♟ Chess Tournament Management System

A full-stack web application for managing chess tournaments — create player profiles, run 4-round single-elimination tournaments for 10 players, randomly select match winners, track performance, disqualify losers, and display a final podium with rankings.

🌐 **Live:** [https://chess-tournament-management-system.vercel.app]
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + React Router v6 (Vite) |
| Backend | Node.js + Express.js |
| Database | Neon DB (PostgreSQL) via `pg` |
| Styling | Custom CSS (no UI library) |

---

## Features

- **Player Management** — Create, view, and delete player profiles stored in PostgreSQL
- **Tournament Management** — Create tournaments and add exactly 10 players before starting
- **4-Round Bracket** — Single-elimination tournament with automatic bracket generation:
  - Round 1: 5 matches (all 10 players paired randomly)
  - Subsequent rounds: winners advance, losers are disqualified
  - Bye handling if the number of active players is odd
- **Random Winner Selection** — One click auto-selects winners randomly for all matches in a round
- **Disqualification** — Losers are immediately disqualified after each round
- **Final Rankings** — 1st, 2nd, and 3rd place podium with full leaderboard
- **Match History** — All rounds and results visible in the tournament detail view

---

## Project Structure

```
chess-tournament/
├── backend/
│   ├── index.js           # Express server entry point
│   ├── db.js              # PostgreSQL connection + DB schema init
│   ├── .env.example       # Environment variable template
│   └── routes/
│       ├── players.js     # Player CRUD endpoints
│       └── tournaments.js # Tournament, round, and match logic
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx         # Router setup
        ├── api.js          # All fetch calls to backend
        ├── styles.css      # Chess-themed dark UI
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── Home.jsx
            ├── Players.jsx
            ├── Tournaments.jsx
            └── TournamentDetail.jsx  # Core tournament management UI
```

---

## Database Schema

```sql
players (id, name, email, created_at)

tournaments (id, name, status, current_round, created_at)
  -- status: 'pending' | 'active' | 'completed'

tournament_players (id, tournament_id, player_id, status, wins, losses)
  -- status: 'active' | 'disqualified'

matches (id, tournament_id, round, player1_id, player2_id,
         winner_id, is_bye, status, created_at)
  -- status: 'pending' | 'completed'
  -- is_bye: true when a player has no opponent and auto-advances
```

---

## API Endpoints

### Players
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/players` | List all players |
| POST | `/api/players` | Create a player `{ name, email }` |
| DELETE | `/api/players/:id` | Delete a player |

### Tournaments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tournaments` | List all tournaments |
| POST | `/api/tournaments` | Create tournament `{ name }` |
| GET | `/api/tournaments/:id` | Tournament detail (players + matches) |
| POST | `/api/tournaments/:id/players` | Add player `{ player_id }` |
| DELETE | `/api/tournaments/:id/players/:playerId` | Remove player |
| POST | `/api/tournaments/:id/start` | Start tournament (requires 10 players) |
| POST | `/api/tournaments/:id/complete-round` | Auto-select winners for current round |
| POST | `/api/tournaments/:id/next-round` | Generate next round from winners |
| GET | `/api/tournaments/:id/results` | Final rankings + podium |

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- A [Neon DB](https://neon.tech) account (free tier works)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd chess-tournament
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your Neon DB connection string:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=5000
```

Start the backend:
```bash
npm run dev    # development (nodemon)
# or
npm start      # production
```

The server will automatically create all required tables on first startup.

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

---

## How to Run a Tournament

1. **Create players** — Go to Players page, add at least 10 players
2. **Create a tournament** — Go to Tournaments, create one
3. **Add players** — Open the tournament, add exactly 10 players
4. **Start** — Click "Start Tournament" to generate Round 1
5. **Complete rounds** — Click "Auto-Select Winners" to randomly pick winners
6. **Advance rounds** — Click "Generate Next Round" until the tournament completes
7. **View results** — The final podium shows 1st, 2nd, and 3rd place

---

## Tournament Bracket Logic

- **Single-elimination** with bye support
- Each round: active players are shuffled randomly and paired
- If an odd number of players remain, one receives a **bye** (auto-advances)
- A player who **loses any match is immediately disqualified**
- The tournament ends when only 1 active player remains — they are the **Champion**
- **Runner-up**: the finalist who lost in the final round
- **3rd place**: the semi-finalist with the most wins

---

## Architecture

```
Browser (React)
     │  HTTP/JSON
     ▼
Express Server (Node.js)
     │
     ├── /api/players   → players.js routes
     └── /api/tournaments → tournaments.js routes (bracket logic lives here)
              │
              ▼
        Neon DB (PostgreSQL)
        [players, tournaments, tournament_players, matches]
```

---

## Tournament Bracket — Round Structure Note

The assignment specifies: R1: 5 matches, R2: 4 matches, R3: 2 semi-finals, R4: 1 final.

In a standard single-elimination bracket starting with 10 players, the match counts per round are mathematically constrained:

| Round | Active Players | Matches | Notes |
|-------|---------------|---------|-------|
| 1     | 10            | 5       | All 10 players paired |
| 2     | 5             | 2 + 1 bye | Odd count — 1 player auto-advances |
| 3     | 3             | 1 + 1 bye | Odd count — 1 player auto-advances |
| 4     | 2             | 1 (Final) | Champion determined |

The system correctly runs **4 rounds** and produces a champion, runner-up, and 3rd place. The match counts in rounds 2 and 3 differ from the spec because "Round 2: 4 matches" would require 8 players advancing from Round 1, which is impossible when 5 are eliminated. The bye mechanism ensures fairness when player counts are odd.

---

## Deployment (Live Demo)

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
# Set env var DATABASE_URL in Railway dashboard
```

### Frontend → Vercel

```bash
npm install -g vercel
cd frontend
# Update vite.config.js proxy target to your Railway backend URL
vercel --prod
```

### Or: One-command deploy via Render

1. Push repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com) pointing to `backend/`
3. Set `DATABASE_URL` environment variable
4. Create a new **Static Site** on Render pointing to `frontend/` with build command `npm run build` and publish dir `dist`
