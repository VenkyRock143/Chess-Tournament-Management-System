import Badge from "./Badge";

function Leaderboard(props) {

    if (props.players.length === 0) {

        return (

            <div className="card">

                <h3>Leaderboard</h3>

                <p>No players found.</p>

            </div>

        );

    }

    return (

        <div className="card">

            <h3>Leaderboard</h3>

            <table className="table">

                <thead>

                    <tr>

                        <th>Player</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {props.players.map(function (player) {

                        let rowClass = "";

                        if (player.status === "disqualified") {

                            rowClass = "disqualified-row";

                        }

                        return (

                            <tr
                                key={player.id}
                                className={rowClass}
                            >

                                <td>

                                    {player.name}

                                    {player.wildcard_used && player.status === "active" && (

                                        <span className="wildcard-tag">
                                            WC
                                        </span>

                                    )}

                                </td>

                                <td>

                                    {player.wins}

                                </td>

                                <td>

                                    {player.losses}

                                </td>

                                <td>

                                    <Badge status={player.status} />

                                </td>

                            </tr>

                        );

                    })}

                </tbody>

            </table>

        </div>

    );

}

export default Leaderboard;