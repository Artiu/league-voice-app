import AppInfoContextProvider from "contexts/AppInfo";
import AuthContextProvider from "contexts/Auth";
import GameStateContextProvider from "contexts/GameState";
import SocketIOContextProvider from "contexts/SocketIO";
import type { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AppInfoContextProvider>
            <AuthContextProvider>
                <SocketIOContextProvider>
                    <GameStateContextProvider>
                        <Component {...pageProps} />
                    </GameStateContextProvider>
                </SocketIOContextProvider>
            </AuthContextProvider>
        </AppInfoContextProvider>
    );
}
