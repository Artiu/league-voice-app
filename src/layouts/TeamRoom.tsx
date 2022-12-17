import { Button, Container, Flex, Select, Text } from "@chakra-ui/react";
import JoinedUser from "components/JoinedUser";
import { useAuthContext } from "contexts/Auth";
import { useGameStateContext } from "contexts/GameState";
import useMic from "hooks/useMic";
import useWebRTC from "hooks/useWebRTC";
import { useEffect, useMemo, useRef, useState } from "react";

export default function TeamRoom() {
    const { summonerName } = useAuthContext();

    const { microphones, activeMicRef, activeMic, activeMicId, updateMic } = useMic();
    const { joinedUsers, changeAudioForAllPeers } = useWebRTC({ micRef: activeMicRef });
    const { teammates, leaveCall } = useGameStateContext();

    const connectedTeammates = useMemo(
        () =>
            joinedUsers.map((user) => ({
                ...user,
                ...teammates.find((teammate) => teammate.summonerName === user.summonerName),
            })),
        [joinedUsers, teammates]
    );

    useEffect(() => changeAudioForAllPeers(activeMic), [activeMic]);

    return (
        <Container maxW="container.xl" width="full">
            <Text fontWeight="semibold" fontSize="xl">
                Microphones:
            </Text>
            <Select value={activeMicId} onChange={(e) => updateMic(e.target.value)} marginTop="2">
                {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label}
                    </option>
                ))}
            </Select>
            <Flex flexWrap="wrap" paddingBlock="8" justifyContent="center" gap="10">
                <JoinedUser
                    summonerName={summonerName}
                    connectionState={"connected"}
                    championId={
                        teammates.find((val) => val.summonerName === summonerName)?.championId
                    }
                    isMyself={true}
                    micSrcObject={activeMic}
                />
                {connectedTeammates.map((teammate) => (
                    <JoinedUser key={teammate.socketId} {...teammate} isMyself={false} />
                ))}
            </Flex>
            <Flex justifyContent="center">
                <Button backgroundColor="red.500" onClick={leaveCall}>
                    Leave call
                </Button>
            </Flex>
        </Container>
    );
}
