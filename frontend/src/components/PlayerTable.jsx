import { formatDate } from "../utils/formatters";

function PlayerTable(props) {

    if (props.players.length === 0) {

        return (

            <p>

                No players found.

            </p>

        );

    }

    return (

        <table className="table">

            <thead>

                <tr>

                    <th>No</th>

                    <th>Name</th>

                    <th>Email</th>

                    {props.onDelete && <th>Joined</th>}
                    {props.onDelete && <th>Action</th>}

                </tr>

            </thead>

            <tbody>

                {props.players.map(function (player, index) {

                    return (

                        <tr key={player.id}>

                            <td>{index + 1}</td>

                            <td>{player.name}</td>

                            <td>{player.email}</td>

                            {props.onDelete &&

                                <td>{formatDate(player.created_at)}</td>

                            }

                            {props.onDelete &&

                                <td>

                                    <button

                                        className="delete-btn"

                                        onClick={function () {

                                            props.onDelete(player.id, player.name);

                                        }}

                                    >

                                        Delete

                                    </button>

                                </td>

                            }

                        </tr>

                    );

                })}

            </tbody>

        </table>

    );

}

export default PlayerTable;