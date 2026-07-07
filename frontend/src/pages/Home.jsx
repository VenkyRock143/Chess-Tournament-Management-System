import { Link } from "react-router-dom";

export default function Home() {

  return (
    <div className="page">

      <div className="card home-card">

        <h1>Chess Tournament Manager</h1>

        <p>
          This project helps you manage chess tournaments.
          You can create players, create tournaments,
          add players into tournaments and generate winners automatically.
        </p>

        <div className="home-buttons">

          <Link
            to="/players"
            className="btn btn-primary"
          >
            Manage Players
          </Link>

          <Link
            to="/tournaments"
            className="btn btn-secondary"
          >
            Manage Tournaments
          </Link>

        </div>

      </div>

      <div className="home-features">

        <div className="card">
          <h3>Create Players</h3>

          <p>
            Add player name and email.
            Every player is stored inside the database.
          </p>
        </div>

        <div className="card">
          <h3>Create Tournament</h3>

          <p>
            Create multiple chess tournaments and manage players easily.
          </p>
        </div>

        <div className="card">
          <h3>Generate Matches</h3>

          <p>
            Matches are created automatically after starting a tournament.
          </p>
        </div>

        <div className="card">
          <h3>View Results</h3>

          <p>
            See winners, rankings and complete tournament history.
          </p>
        </div>

      </div>

    </div>
  );
}