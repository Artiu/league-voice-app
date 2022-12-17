import { useEffect, useRef, useState } from "react";

export default function useMic() {
    const [activeMicId, setActiveMicId] = useState<string | undefined>(
        () => typeof window !== "undefined" && localStorage.getItem("defaultMic")
    );
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const activeMicRef = useRef(new MediaStream());
    const [activeMic, setActiveMic] = useState<MediaStream>();

    const updateMic = async (micId: string) => {
        setActiveMicId(micId);
        localStorage.setItem("defaultMic", micId);
    };

    const getMicrophones = async () => {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter((device) => device.kind === "audioinput");
        if (!activeMicId) {
            updateMic(microphones[0].deviceId);
        }
        return microphones;
    };

    const updateMicrophones = async () => {
        const microphones = await getMicrophones();
        setMicrophones(microphones);
    };

    useEffect(() => {
        (async () => {
            const mic = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: activeMicId },
            });
            activeMicRef.current = mic;
            setActiveMic(mic);
        })();
    }, [activeMicId]);

    useEffect(() => {
        navigator.mediaDevices.addEventListener("devicechange", updateMicrophones);
        updateMicrophones();
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", getMicrophones);
        };
    }, []);

    return {
        activeMicId,
        microphones,
        activeMicRef,
        activeMic,
        updateMic,
    };
}
