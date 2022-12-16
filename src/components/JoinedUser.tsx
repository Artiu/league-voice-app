import { useEffect, useRef, useState } from "react";
import { Card, CardBody, Heading, Skeleton, Image, Button } from "@chakra-ui/react";
import hark from "hark";
import { Teammate, User } from "types/user";
import VolumeChanger from "./VolumeChanger";

interface JoinedUserProps {
    isMyself: boolean;
}

export default function JoinedUser({
    summonerName,
    championId,
    micSrcObject,
    connectionState,
    isMyself,
}: Omit<User, "socketId"> & Teammate & JoinedUserProps) {
    const [isTalking, setIsTalking] = useState(false);
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (!micSrcObject || (!audioRef.current && !isMyself)) return;
        if (!isMyself) {
            audioRef.current.srcObject = micSrcObject;
        }
        if (!micSrcObject.active) return;
        let speechEvents = hark(micSrcObject, { threshold: -70 });
        speechEvents.on("speaking", () => {
            setIsTalking(true);
        });
        speechEvents.on("stopped_speaking", () => {
            setIsTalking(false);
        });
        return () => {
            speechEvents.stop();
            speechEvents = null;
        };
    }, [micSrcObject, audioRef.current]);

    const [championImgUrl, setChampionImgUrl] = useState<string>(null);

    const getChampionImage = async (championId: number) => {
        const latestGameVersion = await fetch(
            "https://ddragon.leagueoflegends.com/api/versions.json"
        )
            .then((res) => res.json())
            .then((data) => data[0]);

        const championListLink = `https://ddragon.leagueoflegends.com/cdn/${latestGameVersion}/data/en_US/champion.json`;
        const championName = await fetch(championListLink)
            .then((res) => res.json())
            .then(({ data }) => {
                for (const property in data) {
                    if (Number(data[property].key) === championId) {
                        return data[property].id;
                    }
                }
            });
        return `https://ddragon.leagueoflegends.com/cdn/${latestGameVersion}/img/champion/${championName}.png`;
    };

    useEffect(() => {
        getChampionImage(championId).then((imgUrl) => setChampionImgUrl(imgUrl));
    }, [championId]);

    const [volume, setVolume] = useState(100);

    const updateVolume = (newVolume: number) => {
        setVolume(newVolume);
        audioRef.current.volume = newVolume / 100;
    };

    const [isMuted, setIsMuted] = useState(false);

    const toggleMicMute = () => {
        if (!micSrcObject) return;
        micSrcObject.getAudioTracks()[0].enabled = !micSrcObject.getAudioTracks()[0].enabled;
        setIsMuted((val) => !val);
    };

    return (
        <Card px="12" py="4" textAlign="center">
            <CardBody display="flex" flexDir="column" alignItems="center" gap="4">
                <Heading size="md">{isMyself ? `You (${summonerName})` : summonerName}</Heading>
                {championImgUrl ? (
                    <Image
                        src={championImgUrl}
                        width={120}
                        height={120}
                        borderStyle="solid"
                        borderWidth="4px"
                        borderColor={isTalking ? "green.500" : "transparent"}
                        alt="Champion image"
                    />
                ) : (
                    <Skeleton width="120px" height="120px" />
                )}
                {isMyself ? (
                    <Button backgroundColor={isMuted && "red.500"} onClick={toggleMicMute}>
                        {isMuted ? "Muted" : "Mute"}
                    </Button>
                ) : (
                    <>
                        <audio ref={audioRef} autoPlay />
                        <VolumeChanger volume={volume} onChange={updateVolume} />
                        {connectionState}
                    </>
                )}
            </CardBody>
        </Card>
    );
}
