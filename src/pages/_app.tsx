import { Box } from "@chakra-ui/react";
import Footer from "components/Footer";
import Navbar from "components/Navbar";
import ContextProviders from "contexts/Providers";
import { NextSeo } from "next-seo";
import type { AppProps } from "next/app";
import logo from "../../public/logo.png";
import adapter from "webrtc-adapter";

export default function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<NextSeo
				title="League Voice"
				description="League Voice is app for connecting you with your teammates from LoL match."
				additionalLinkTags={[{ rel: "icon", href: logo.src }]}
			/>
			<ContextProviders>
				<Box display="flex" flexDir="column" minHeight="100vh">
					<Navbar />
					<Box flex="1">
						<Component {...pageProps} />
					</Box>
					<Footer />
				</Box>
			</ContextProviders>
		</>
	);
}
