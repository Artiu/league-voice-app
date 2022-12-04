import { useEffect, useRef, useState } from "react";
import { Card, CardBody, Heading, Skeleton, Image } from "@chakra-ui/react";
import hark from "hark";
import { Teammate, User } from "types/user";
import VolumeChanger from "./VolumeChanger";

const getChampionImage = async (championId: number) => {
    const latestGameVersion = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
        .then((res) => res.json())
        .then((data) => data[0]);

    const championName = await fetch(
        `http://ddragon.leagueoflegends.com/cdn/${latestGameVersion}/data/en_US/champion.json`
    )
        .then((res) => res.json())
        .then(({ data }) => {
            for (const property in data) {
                if (Number(data[property].key) === championId) {
                    return data[property].id;
                }
            }
        });
    return `http://ddragon.leagueoflegends.com/cdn/${latestGameVersion}/img/champion/${championName}.png`;
};

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
        let speechEvents = hark(micSrcObject);
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

    useEffect(() => {
        getChampionImage(championId).then((imgUrl) => setChampionImgUrl(imgUrl));
    }, [championId]);

    const [volume, setVolume] = useState(100);

    const updateVolume = (newVolume: number) => {
        setVolume(newVolume);
        audioRef.current.volume = newVolume / 100;
    };

    return (
        <Card w="max-content" p="4" textAlign="center">
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
                {!isMyself && (
                    <>
                        <audio ref={audioRef} autoPlay />
                        <VolumeChanger volume={volume} onChange={updateVolume} />
                    </>
                )}
                {connectionState}
            </CardBody>
        </Card>
    );
}
