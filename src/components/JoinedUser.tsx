import { useEffect, useRef } from "react";
import { UserI } from "types/User";

export default function JoinedUser({ id, micSrcObject }: UserI) {
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (!micSrcObject || !audioRef.current) return;
        console.log(micSrcObject.getTracks());

        audioRef.current.srcObject = micSrcObject;
    }, [micSrcObject, audioRef.current]);

    return (
        <p>
            {id}
            <audio ref={audioRef} controls autoPlay />
        </p>
    );
}
