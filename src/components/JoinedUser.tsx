import { useEffect, useRef } from "react";
import { Teammate, User } from "types/user";

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

    return (
        <p>
            {summonerName} : {championId}
            <audio ref={audioRef} controls autoPlay />
            {connectionState}
        </p>
    );
}
