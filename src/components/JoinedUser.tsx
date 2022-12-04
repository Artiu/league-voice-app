import { useEffect, useRef, useState } from "react";
import { Card, CardBody, Heading, Skeleton, Image } from "@chakra-ui/react";
import hark from "hark";
import { Teammate, User } from "types/user";

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

export default function JoinedUser({
    summonerName,
    championId,
    micSrcObject,
    connectionState,
}: User & Teammate) {
    const [isTalking, setIsTalking] = useState(false);
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (!micSrcObject || !audioRef.current) return;
        audioRef.current.srcObject = micSrcObject;
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

    return (
        <Card w="max-content" p="4" textAlign="center">
            <CardBody display="flex" flexDir="column" alignItems="center" gap="4">
                <Heading size="md">{summonerName}</Heading>
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
                <audio ref={audioRef} autoPlay />
                {connectionState}
            </CardBody>
        </Card>
    );
}
