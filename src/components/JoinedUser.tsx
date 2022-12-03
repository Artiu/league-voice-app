import { useEffect, useRef, useState } from "react";
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
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (!micSrcObject || !audioRef.current) return;
        audioRef.current.srcObject = micSrcObject;
    }, [micSrcObject, audioRef.current]);

    const [championImgUrl, setChampionImgUrl] = useState<string>(null);

    useEffect(() => {
        getChampionImage(championId).then((imgUrl) => setChampionImgUrl(imgUrl));
    }, [championId]);

    return (
        <p>
            {summonerName}
            <img src={championImgUrl} width={120} height={120} alt="Champion image" />
            <audio ref={audioRef} controls autoPlay />
            {connectionState}
        </p>
    );
}
