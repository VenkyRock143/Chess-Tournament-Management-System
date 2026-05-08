# ♟ Chess Tournament Management System

A full-stack web application to manage chess tournaments.

## Tech Stack
- **Frontend:** React 18 + React Router v6 (Vite)
- **Backend:** Node.js + Express.js
- **Database:** Neon DB (PostgreSQL) via `pg`

## How to Run

### 1. Clone the repo
git clone <your-repo-url>
cd chess-tournament

### 2. Backend
cd backend
npm install
cp .env.example .env
# Add your Neon DB connection string to .env
npm run dev

### 3. Frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173

## Database
Tables are created automatically on first server start.
No manual SQL needed.

## How to Run a Tournament
1. Go to Players — add at least 10 players
2. Go to Tournaments — create a new tournament
3. Open it — add exactly 10 players
4. Click Start Tournament
5. Click Auto-Select Winners each round
6. Click Generate Next Round until complete
7. View the final podium and full rankings