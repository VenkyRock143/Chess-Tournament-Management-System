# ♟️ Chess Tournament Management System

A full-stack web application for organizing and running a 10-player, 4-round elimination chess tournament, complete with a wildcard re-entry system for handling odd numbers of active players fairly.

Built as a technical assignment demonstrating REST API design, relational database modeling, and transactional data integrity in a full-stack JavaScript application.

**Live demo:** [Chess Management System](https://chess-management-systems.netlify.app/)

---

## Features

- **Player management** — add, view, and remove players
- **Tournament lifecycle** — create a tournament, register exactly 10 players, and start it
- **Automated bracket generation** — players are randomly and fairly paired each round using a Fisher–Yates shuffle
- **Wildcard system** — when an odd number of players remain, the best-performing eliminated player is re-entered instead of handing out a free bye
- **Live standings** — track wins, losses, and active/disqualified status per player, per tournament
- **Final results** — automatically computed champion, runner-up, and third place

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (hosted on Neon) |
| Deployment | Netlify (frontend) · Render (backend) |

---

## Project Structure

```
final/
├── backend/
│   ├── config/          # Database connection & table initialization
│   ├── controllers/     # Request handling & business logic
│   ├── middleware/       # Centralized error handling
│   ├── models/            # SQL queries (Player, Tournament)
│   ├── routes/            # API route definitions
│   ├── utils/              # Shuffle & bracket pairing helpers
│   └── index.js
└── frontend/
    ├── src/
    │   ├── api/            # Fetch wrappers per resource
    │   ├── components/     # Reusable UI (Navbar, PlayerTable, MatchRound, etc.)
    │   ├── hooks/            # Data-fetching & state hooks
    │   └── pages/            # Route-level views
    └── vite.config.js
```

The backend follows a **routes → controllers → models** pattern: routes wire URLs to controller functions, controllers hold request/response logic and orchestrate transactions, and models are the only place raw SQL lives.

---

## Database Schema

| Table | Purpose |
|---|---|
| `players` | Global player registry (name, email) |
| `tournaments` | Tournament metadata (name, status, current round) |
| `tournament_players` | Per-tournament player state (wins, losses, active/disqualified, wildcard usage) |
| `matches` | Every match played, per round, with result and bye/wildcard flags |

Player statistics live on `tournament_players` rather than `players`, since a player's record is scoped to a single tournament, not global across all tournaments they've joined.

---

## How the Tournament Works

1. **Start** — requires exactly 10 registered players. Players are shuffled and paired into Round 1 matches inside a database transaction.
2. **Complete Round** — each match resolves a winner; the loser is marked disqualified.
3. **Next Round** — remaining active players are re-shuffled and re-paired.
   - If the number of active players is **odd**, the best-record eliminated player who hasn't already used a wildcard is reactivated to fill the gap, rather than issuing an automatic bye.
4. **Tournament ends** when one player remains. Results (champion, runner-up, third place) are computed from match history.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) instance)

### 1. Clone & install
```bash
git clone https://github.com/VenkyRock143/Chess-Tournament-Management-System

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`**
```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000
```

> `backend/.env` is git-ignored on purpose — never commit real database credentials. Use `backend/.env.example` as a template.

### 3. Run locally
```bash
# Terminal 1 — backend (runs on :5000)
cd backend
npm run dev

# Terminal 2 — frontend (runs on :5173)
cd frontend
npm run dev
```

The database tables are created automatically on backend startup — no manual migration step is required.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `/api/players` | List / create players |
| DELETE | `/api/players/:id` | Remove a player |
| GET / POST | `/api/tournaments` | List / create tournaments |
| GET / DELETE | `/api/tournaments/:id` | Get details / delete a tournament |
| POST | `/api/tournaments/:id/players` | Add a player to a tournament |
| DELETE | `/api/tournaments/:id/players/:playerId` | Remove a player from a tournament |
| POST | `/api/tournaments/:id/start` | Start the tournament (generates Round 1) |
| POST | `/api/tournaments/:id/complete-round` | Resolve results for the current round |
| POST | `/api/tournaments/:id/next-round` | Generate the next round's pairings |
| GET | `/api/tournaments/:id/results` | Get final standings once complete |

---