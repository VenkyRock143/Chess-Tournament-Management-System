import Badge from "./Badge";
import { getRoundLabel } from "../utils/formatters";

function MatchRound(props) {
  const roundMatches = [];

  for (let i = 0; i < props.matches.length; i++) {
    if (props.matches[i].round === props.round) {
      roundMatches.push(props.matches[i]);
    }
  }

  return (
    <div className="card">
      <h3>{getRoundLabel(props.round, props.maxRound)}</h3>

      <table className="table">
        <thead>
          <tr>
            <th>Player 1</th>
            <th>VS</th>
            <th>Player 2</th>
            <th>Winner</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {roundMatches.map(function (match) {
            let player1Class = "";
            let player2Class = "";

            if (match.winner_id === match.player1_id) {
              player1Class = "winner-cell";
            }

            if (match.winner_id === match.player2_id) {
              player2Class = "winner-cell";
            }

            let winner = "-";

            if (match.winner_name) {
              winner = "🏆 " + match.winner_name;
            }

            let player2 = match.player2_name;

            if (match.is_bye) {
              player2 = "BYE";
            }

            return (
              <tr key={match.id}>
                <td className={player1Class}>{match.player1_name}</td>

                <td>VS</td>

                <td className={player2Class}>
                  {player2}

                  {match.is_wildcard && (
                    <span className="wildcard-tag">WILDCARD</span>
                  )}
                </td>

                <td>{winner}</td>

                <td>
                  <Badge status={match.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MatchRound;
