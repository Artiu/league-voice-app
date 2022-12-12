import { useToast } from "@chakra-ui/react";
import { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuthContext } from "./Auth";

const socketIO = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
    autoConnect: false,
});

const SocketIOContext = createContext(socketIO);

export default function SocketIOContextProvider({ children }) {
    const { summonerName, isLoggedIn, logOut } = useAuthContext();
    const toast = useToast();

    useEffect(() => {
        if (socketIO.connected && isLoggedIn) return;
        if (!isLoggedIn) {
            socketIO.disconnect();
            return;
        }
        socketIO.auth = { summonerName };
        socketIO.on("connect_error", (err) => {
            if (err.message === "unauthorized") {
                toast({
                    title: "Unauthorized",
                    status: "error",
                    duration: 9000,
                    isClosable: true,
                });
                logOut();
            }
            if (err.message === "rate-limit") {
                toast({
                    title: "Too many login attempts. Try again later!",
                    status: "error",
                    duration: 9000,
                    isClosable: true,
                });
                logOut();
            }
        });
        socketIO.connect();
        return () => {
            socketIO.off("connect_error");
            if (!socketIO.connected) return;
            socketIO.disconnect();
        };
    }, [isLoggedIn]);

    return <SocketIOContext.Provider value={socketIO}>{children}</SocketIOContext.Provider>;
}

export const useSocketIOContext = () => useContext(SocketIOContext);
