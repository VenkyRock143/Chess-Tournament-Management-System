import { useEffect, useState } from "react";

import {
  getTournament,
  getTournamentResults,
  addPlayerToTournament,
  removePlayerFromTournament,
  startTournament,
  completeRound,
  nextRound,
} from "../api/tournamentApi";

import { TOURNAMENT_STATUS } from "../utils/constants";

function useTournament(tournamentId) {
  const [tournament, setTournament] = useState(null);

  const [players, setPlayers] = useState([]);

  const [matches, setMatches] = useState([]);

  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadTournament() {
    setLoading(true);

    setError("");

    try {
      const data = await getTournament(tournamentId);

      setTournament(data.tournament);

      setPlayers(data.players);

      setMatches(data.matches);

      if (data.tournament.status === TOURNAMENT_STATUS.COMPLETED) {
        const result = await getTournamentResults(tournamentId);

        setResults(result);
      } else {
        setResults(null);
      }
    } catch (error) {
      setError(error.message);
    }

    setLoading(false);
  }

  useEffect(
    function () {
      loadTournament();
    },
    [tournamentId],
  );

  async function addPlayer(playerId) {
    await addPlayerToTournament(
      tournamentId,

      playerId,
    );

    loadTournament();
  }

  async function removePlayer(playerId) {
    await removePlayerFromTournament(
      tournamentId,

      playerId,
    );

    loadTournament();
  }

  async function start() {
    await startTournament(tournamentId);

    loadTournament();
  }

  async function finishRound() {
    await completeRound(tournamentId);

    loadTournament();
  }

  async function goToNextRound() {
    await nextRound(tournamentId);

    loadTournament();
  }

  return {
    tournament,

    players,

    matches,

    results,

    loading,

    error,

    actions: {
      addPlayer,

      removePlayer,

      start,

      completeRound: finishRound,

      nextRound: goToNextRound,
    },
  };
}

export default useTournament;
