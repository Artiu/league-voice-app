import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

interface GameState {
    isInMatch: boolean;
    setIsInMatch: Dispatch<SetStateAction<boolean>>;
}

const GameStateContext = createContext<GameState>(undefined);

export default function GameStateContextProvider({ children }) {
    const [isInMatch, setIsInMatch] = useState(false);
    return (
        <GameStateContext.Provider value={{ isInMatch, setIsInMatch }}>
            {children}
        </GameStateContext.Provider>
    );
}

export const useGameStateContext = () => {
    return useContext(GameStateContext);
};
