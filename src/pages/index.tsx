import { ChangeEvent, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

interface UserI {
    id: string;
    micSrcObject?: MediaProvider;
}

const socket = io("192.168.0.115:3001");

function User({ id, micSrcObject }: UserI) {
    const audioRef = useRef<HTMLAudioElement>();

    useEffect(() => {
        if (!micSrcObject) return;
        audioRef.current.srcObject = micSrcObject;
    }, [micSrcObject]);

    return (
        <p>
            {id}
            <audio ref={audioRef} controls autoPlay />
        </p>
    );
}

export default function App() {
    const [joinedUsers, setJoinedUsers] = useState<UserI[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();

    const getMicrophone = async (micId: string) => {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: micId } });
        return mic;
    };

    const createPeerConnection = async (userIdToConnect: string) => {
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        const peerConnection = new RTCPeerConnection(configuration);
        connectionsRef.current.set(userIdToConnect, peerConnection);
        let remoteMic: MediaStream;
        peerConnection.addEventListener("track", (event) => {
            console.log(event);

            remoteMic = event.streams[0];
            setJoinedUsers((users) => {
                const copy = [...users];
                const user = copy.find((user) => user.id === userIdToConnect);
                if (!user) return copy;
                user.micSrcObject = remoteMic;
                return copy;
            });
        });
        peerConnection.addEventListener("connectionstatechange", () => {
            console.log(peerConnection.connectionState);

            if (peerConnection.connectionState === "connected") {
                setJoinedUsers((users) => [
                    ...users,
                    { id: userIdToConnect, micSrcObject: remoteMic },
                ]);
            }
            if (peerConnection.connectionState === "disconnected") {
                connectionsRef.current.delete(userIdToConnect);
                setJoinedUsers((users) => users.filter((user) => user.id !== userIdToConnect));
            }
        });
        peerConnection.addEventListener("icecandidate", (event) => {
            console.log("ice");

            socket.emit("iceCandidate", event.candidate, userIdToConnect);
        });
        return peerConnection;
    };

    useEffect(() => {
        connectionsRef.current = new Map();
        socket.on("userJoined", async (joinedUserId) => {
            const peerConnection = await createPeerConnection(joinedUserId);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, joinedUserId);
        });
        socket.on("offer", async (offer, from) => {
            const peerConnection = await createPeerConnection(from);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, from);
        });
        socket.on("answer", async (answer, from) => {
            const remoteDesc = new RTCSessionDescription(answer);
            const peerConnection = connectionsRef.current.get(from);
            await peerConnection.setRemoteDescription(remoteDesc);
        });
        socket.on("iceCandidate", async (iceCandidate, from) => {
            await connectionsRef.current.get(from)?.addIceCandidate(iceCandidate);
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    const [activeMicId, setActiveMicId] = useState<string>();
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);

    const getMicrophones = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter((device) => device.kind === "audioinput");
        setMicrophones(microphones);
        const defaultMic = localStorage.getItem("defaultMic");
        if (defaultMic) {
            changeMic(defaultMic);
            return;
        }
        changeMic(microphones[0].deviceId);
    };

    const changeMic = async (newMicId: string) => {
        setActiveMicId(newMicId);
        const newMic = await getMicrophone(newMicId);
        connectionsRef.current.forEach((conn) => {
            conn.addTrack(newMic.getAudioTracks()[0], newMic);
        });
        localStorage.setItem("defaultMic", newMicId);
    };

    useEffect(() => {
        getMicrophones();
    }, []);

    return (
        <>
            <select value={activeMicId} onChange={(e) => changeMic(e.target.value)}>
                {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label}
                    </option>
                ))}
            </select>
            {joinedUsers.map((user) => (
                <User key={user.id} {...user} />
            ))}
        </>
    );
}
