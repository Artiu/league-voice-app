import { ChakraProvider } from "@chakra-ui/react";
import Navbar from "components/Navbar";
import AppInfoContextProvider from "contexts/AppInfo";
import AuthContextProvider from "contexts/Auth";
import GameStateContextProvider from "contexts/GameState";
import SocketIOContextProvider from "contexts/SocketIO";
import { NextSeo } from "next-seo";
import type { AppProps } from "next/app";
import logo from "../public/logo.png";

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <>
            <NextSeo
                title="League Voice"
                description="League Voice is app for connecting you with your teammates from LoL match."
                additionalLinkTags={[{ rel: "icon", href: logo.src }]}
            />
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
