import { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuthContext } from "./Auth";

const socketIO = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
    autoConnect: false,
});

const SocketIOContext = createContext(socketIO);

export default function SocketIOContextProvider({ children }) {
    const { summonerName, isLoggedIn } = useAuthContext();
    useEffect(() => {
        if (socketIO.connected && isLoggedIn) return;
        if (!isLoggedIn) socketIO.disconnect();
        socketIO.auth = { summonerName };
        socketIO.connect();
        return () => {
            if (!socketIO.connected) return;
            socketIO.disconnect();
        };
    }, [isLoggedIn]);

    return <SocketIOContext.Provider value={socketIO}>{children}</SocketIOContext.Provider>;
}

export const useSocketIOContext = () => useContext(SocketIOContext);
