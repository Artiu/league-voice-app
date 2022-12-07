import { ChakraProvider } from "@chakra-ui/react";
import Navbar from "components/Navbar";
import AppInfoContextProvider from "contexts/AppInfo";
import AuthContextProvider from "contexts/Auth";
import GameStateContextProvider from "contexts/GameState";
import SocketIOContextProvider from "contexts/SocketIO";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <title>League Voice</title>
            </Head>
            <AppInfoContextProvider>
                <AuthContextProvider>
                    <ChakraProvider>
                        <SocketIOContextProvider>
                            <GameStateContextProvider>
                                <Navbar />
                                <Component {...pageProps} />
                            </GameStateContextProvider>
                        </SocketIOContextProvider>
                    </ChakraProvider>
                </AuthContextProvider>
            </AppInfoContextProvider>
        </>
    );
}
