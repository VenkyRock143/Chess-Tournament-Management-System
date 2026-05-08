# ♟ Chess Tournament Management System

A full-stack web application that manages chess tournaments with player registration, automated bracket generation, random winner selection, disqualification tracking, and a final podium display.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + React Router v6 (Vite)   |
| Backend  | Node.js + Express.js                |
| Database | Neon DB (PostgreSQL) via `pg` driver |

---

## Architecture Overview

```
┌─────────────────────────────────┐
│         React Frontend          │  localhost:5173  (Vite dev server)
│  Players / Tournaments / Detail │
│         pages + api.js          │
└──────────────┬──────────────────┘
               │  HTTP /api/*  (Vite proxy → port 5000)
┌──────────────▼──────────────────┐
│       Express.js Backend        │  localhost:5000
│  routes/players.js              │
│  routes/tournaments.js          │
└──────────────┬──────────────────┘
               │  pg Pool (TLS)
┌──────────────▼──────────────────┐
│         Neon DB (PostgreSQL)     │
│  players · tournaments          │
│  tournament_players · matches   │
└─────────────────────────────────┘
```

### Directory Structure

```
chess-tournament-Management-System/
├── backend/
│   ├── db.js              # DB pool + auto-creates tables on startup
│   ├── index.js           # Express app entry point + CORS + routes
│   ├── .env.example       # Template — copy to .env and fill in your DB URL
│   └── routes/
│       ├── players.js     # CRUD for player profiles (create/edit/delete)
│       └── tournaments.js # Tournament lifecycle + bracket engine
└── frontend/
    ├── vite.config.js     # Proxies /api → localhost:5000
    └── src/
        ├── api.js         # All fetch calls in one place
        ├── App.jsx        # Router setup
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── Home.jsx
            ├── Players.jsx          # Create / Edit / Delete players
            ├── Tournaments.jsx      # Create + list tournaments
            └── TournamentDetail.jsx # Full tournament lifecycle UI
```

---

## Database Schema

### `players`
| Column     | Type         | Notes                  |
|------------|--------------|------------------------|
| id         | SERIAL PK    |                        |
| name       | VARCHAR(100) | required               |
| email      | VARCHAR(100) | unique, required       |
| created_at | TIMESTAMP    | default NOW()          |

### `tournaments`
| Column        | Type         | Notes                              |
|---------------|--------------|------------------------------------|
| id            | SERIAL PK    |                                    |
| name          | VARCHAR(100) | required                           |
| status        | VARCHAR(20)  | pending / active / completed       |
| current_round | INTEGER      | 0 before start, 1–4 during play    |
| created_at    | TIMESTAMP    | default NOW()                      |

### `tournament_players`
| Column        | Type       | Notes                               |
|---------------|------------|-------------------------------------|
| id            | SERIAL PK  |                                     |
| tournament_id | FK         | references tournaments(id)          |
| player_id     | FK         | references players(id)              |
| status        | VARCHAR    | active / disqualified               |
| wins          | INTEGER    | incremented on each win             |
| losses        | INTEGER    | incremented on each loss            |
| UNIQUE        |            | (tournament_id, player_id)          |

### `matches`
| Column        | Type       | Notes                               |
|---------------|------------|-------------------------------------|
| id            | SERIAL PK  |                                     |
| tournament_id | FK         |                                     |
| round         | INTEGER    | 1–4                                 |
| player1_id    | FK         |                                     |
| player2_id    | FK         | NULL for bye matches                |
| winner_id     | FK         | set when match is completed         |
| is_bye        | BOOLEAN    | default false                       |
| status        | VARCHAR    | pending / completed                 |
| created_at    | TIMESTAMP  |                                     |

---

## Tournament Bracket Structure

The system enforces a fixed **4-round bracket** for exactly 10 players:

| Round | Matches | Players Active | Notes                                 |
|-------|---------|---------------|---------------------------------------|
| 1     | 5       | 10 → 5 win    | All 10 play; 5 winners advance        |
| 2     | 4       | 8             | 5 winners + 3 wild-card lucky losers  |
| 3     | 2       | 4             | Semi-finals                           |
| 4     | 1       | 2             | Grand Final                           |

**Wild-card rule**: After Round 1, the 5 winners automatically advance. Three of the five losers are randomly selected as wild-card players to fill the 8-player Round 2 bracket. The remaining two losers are disqualified.

**Disqualification**: Any player who loses a match in rounds 2–4 is immediately disqualified. The system records and displays all disqualifications.

**Winner selection**: All winners are chosen randomly (coin flip) to simulate match results.

---

## API Endpoints

### Players

| Method | Path               | Description              |
|--------|--------------------|--------------------------|
| GET    | /api/players       | List all players         |
| POST   | /api/players       | Create a player          |
| PUT    | /api/players/:id   | Update player name/email |
| DELETE | /api/players/:id   | Delete a player          |

### Tournaments

| Method | Path                                   | Description                          |
|--------|----------------------------------------|--------------------------------------|
| GET    | /api/tournaments                       | List all tournaments                 |
| POST   | /api/tournaments                       | Create a tournament                  |
| GET    | /api/tournaments/:id                   | Get tournament + players + matches   |
| POST   | /api/tournaments/:id/players           | Add a player to a tournament         |
| DELETE | /api/tournaments/:id/players/:playerId | Remove a player (pending only)       |
| POST   | /api/tournaments/:id/start             | Start tournament, generate Round 1   |
| POST   | /api/tournaments/:id/complete-round    | Randomly select winners for round    |
| POST   | /api/tournaments/:id/next-round        | Generate the next round              |
| GET    | /api/tournaments/:id/results           | Get final podium and full rankings   |

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- A [Neon DB](https://neon.tech) account (free tier works)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd chess-tournament-Management-System
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set your Neon DB connection string:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
PORT=5000
```

> **Security**: `.env` is listed in `.gitignore` and must never be committed. `.env.example` is safe to commit — it has no real credentials.

Start the backend:
```bash
npm run dev     # uses nodemon for hot reload
```

Tables are **created automatically** on first start — no manual SQL needed.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## How to Run a Tournament (Step-by-Step)

1. **Players tab** — add at least 10 players (name + email). Use ✏ Edit to update any profile.
2. **Tournaments tab** — click "+ Create" and name your tournament
3. **Open the tournament** — add exactly 10 players using the dropdown
4. Click **🚀 Start Tournament** — Round 1 (5 matches) is generated
5. Click **🎲 Auto-Select Winners** — winners are chosen randomly
6. Click **⏭ Generate Next Round** — Round 2 (4 matches) with wild-cards
7. Repeat steps 5–6 for Rounds 3 (semi-finals) and 4 (final)
8. After the final, view the **🏅 podium** and full rankings table

---

## Key Design Decisions

- **Auto table creation**: `db.js` runs `CREATE TABLE IF NOT EXISTS` on startup — no migration scripts needed.
- **Transactions**: All round-completion and next-round logic uses `BEGIN / COMMIT / ROLLBACK` to prevent partial state on error.
- **Wild-card system**: After Round 1, 3 randomly chosen losers get a second chance, ensuring Round 2 always has exactly 4 matches (the required 10→8→4→2→1 bracket).
- **Vite proxy**: `vite.config.js` proxies `/api` to `localhost:5000` — no CORS issues in development.
- **Unique email constraint**: Prevents duplicate player registrations at the database level.