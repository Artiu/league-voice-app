import { createContext, useContext, useEffect, useState } from "react";
import { Teammate } from "types/user";
import { useSocketIOContext } from "./SocketIO";

interface GameState {
    teammates: Teammate[];
    isInMatch: boolean;
    leaveMatch: () => void;
}

const GameStateContext = createContext<GameState>(undefined);

export default function GameStateContextProvider({ children }) {
    const socket = useSocketIOContext();
    const [teammates, setTeammates] = useState<Teammate[]>([]);

    const leaveMatch = () => {
        setTeammates([]);
    };

    useEffect(() => {
        const onMatchStarted = (teammates: Teammate[]) => {
            setTeammates(teammates);
        };
        socket.on("matchStarted", onMatchStarted);

        return () => {
            socket.off("matchStarted", onMatchStarted);
        };
    }, []);

    return (
        <GameStateContext.Provider
            value={{ teammates, leaveMatch, isInMatch: teammates.length > 0 }}
        >
            {children}
        </GameStateContext.Provider>
    );
}

export const useGameStateContext = () => {
    return useContext(GameStateContext);
};
