import { useEffect, useState } from "react";

import {

    getPlayers,

    createPlayer,

    deletePlayer

} from "../api/playerApi";


function usePlayers() {

    const [players, setPlayers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");



    async function loadPlayers() {

        setLoading(true);

        setError("");

        try {

            const data = await getPlayers();

            setPlayers(data);

        } catch (error) {

            setError(error.message);

        }

        setLoading(false);

    }


    useEffect(function () {

        loadPlayers();

    }, []);



    async function addPlayer(player) {

        try {

            await createPlayer(player);

            loadPlayers();

        } catch (error) {

            throw error;

        }

    }



    async function removePlayer(id) {

        try {

            await deletePlayer(id);

            loadPlayers();

        } catch (error) {

            throw error;

        }

    }



    return {

        players,

        loading,

        error,

        addPlayer,

        removePlayer,

        refresh: loadPlayers

    };

}

export default usePlayers;