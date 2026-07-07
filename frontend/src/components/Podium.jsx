function Podium(props) {
  return (
    <div className="card">
      <h3>Tournament Winners</h3>

      <div className="podium">
        {props.podium.first && (
          <div className="podium-box first">
            <h2>🥇</h2>

            <h3>Champion</h3>

            <p>{props.podium.first.name}</p>

            <p>Wins : {props.podium.first.wins}</p>

            <p>Losses : {props.podium.first.losses}</p>
          </div>
        )}

        {props.podium.second && (
          <div className="podium-box second">
            <h2>🥈</h2>

            <h3>Second Place</h3>

            <p>{props.podium.second.name}</p>

            <p>Wins : {props.podium.second.wins}</p>

            <p>Losses : {props.podium.second.losses}</p>
          </div>
        )}

        {props.podium.third && (
          <div className="podium-box third">
            <h2>🥉</h2>

            <h3>Third Place</h3>

            <p>{props.podium.third.name}</p>

            <p>Wins : {props.podium.third.wins}</p>

            <p>Losses : {props.podium.third.losses}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Podium;
