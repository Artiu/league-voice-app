import { ChakraProvider } from "@chakra-ui/react";
import AppInfoContextProvider from "./AppInfo";
import AuthContextProvider from "./Auth";
import GameStateContextProvider from "./GameState";
import SocketIOContextProvider from "./SocketIO";

export default function ContextProviders({ children }) {
    return (
        <AppInfoContextProvider>
            <AuthContextProvider>
                <ChakraProvider>
                    <SocketIOContextProvider>
                        <GameStateContextProvider>{children}</GameStateContextProvider>
                    </SocketIOContextProvider>
                </ChakraProvider>
            </AuthContextProvider>
        </AppInfoContextProvider>
    );
}
