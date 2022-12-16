import { Box, ChakraProvider } from "@chakra-ui/react";
import Footer from "components/Footer";
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
                                <Box display="flex" flexDir="column" minHeight="100vh">
                                    <Navbar />
                                    <Box flex="1">
                                        <Component {...pageProps} />
                                    </Box>
                                    <Footer />
                                </Box>
                            </GameStateContextProvider>
                        </SocketIOContextProvider>
                    </ChakraProvider>
                </AuthContextProvider>
            </AppInfoContextProvider>
        </>
    );
}
