import AuthContextProvider from "contexts/Auth";
import GameStateContextProvider from "contexts/GameState";
import type { AppProps } from "next/app";

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AuthContextProvider>
            <GameStateContextProvider>
                <Component {...pageProps} />
            </GameStateContextProvider>
        </AuthContextProvider>
    );
}
