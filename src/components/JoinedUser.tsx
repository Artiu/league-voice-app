import { useEffect, useRef } from "react";
import { Player, UserI } from "types/user";

export default function JoinedUser({
    id,
    assignedPosition,
    championId,
    micSrcObject,
}: UserI & Player) {
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (!micSrcObject || !audioRef.current) return;
        audioRef.current.srcObject = micSrcObject;
    }, [micSrcObject, audioRef.current]);

    return (
        <p>
            {id}: {assignedPosition} : {championId}
            <audio ref={audioRef} controls autoPlay />
        </p>
    );
}
