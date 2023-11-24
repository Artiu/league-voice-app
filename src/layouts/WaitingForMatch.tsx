import { Button, Container, Text } from "@chakra-ui/react";
import { useGameStateContext } from "contexts/GameState";

export default function WaitingForMatch() {
	const { hasLeftCall, joinCall } = useGameStateContext();

	return (
		<Container
			display="flex"
			flexDirection="column"
			gap="4"
			alignItems="center"
			textAlign="center"
			marginTop="4"
		>
			<Text>{hasLeftCall ? "Match in progress" : "Waiting for match to start..."}</Text>
			<Button width="max-content" onClick={joinCall}>
				{hasLeftCall ? "Reconnect" : "Connect"}
			</Button>
		</Container>
	);
}
