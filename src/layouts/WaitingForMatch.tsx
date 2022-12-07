import { Button, Container, Text } from "@chakra-ui/react";
import { useAppInfoContext } from "contexts/AppInfo";
import { useGameStateContext } from "contexts/GameState";

export default function WaitingForMatch() {
    const { isTauri } = useAppInfoContext();
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
            {(!isTauri || hasLeftCall) && (
                <Button width="max-content" onClick={joinCall}>
                    {hasLeftCall ? "Reconnect" : "Connect"}
                </Button>
            )}
        </Container>
    );
}
