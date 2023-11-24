import { Container, Text } from "@chakra-ui/react";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
	return (
		<Container
			display="flex"
			justifyContent="flex-end"
			alignItems="center"
			maxWidth="unset"
			padding="4"
			margin="unset"
			position="relative"
		>
			<Text
				position="absolute"
				left="50%"
				transform="translate(-50%)"
				fontSize="2xl"
				fontWeight="semibold"
			>
				League Voice
			</Text>
			<LogoutButton />
		</Container>
	);
}
