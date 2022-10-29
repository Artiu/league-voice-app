import { useEffect, useRef, useState } from "react";
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
            <audio ref={audioRef} controls />
        </p>
    );
}

export default function App() {
    const [joinedUsers, setJoinedUsers] = useState<UserI[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();
    const micRef = useRef<MediaStream>();

    const getMicrophone = async () => {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        micRef.current = mic;
        return mic;
    };

    const createPeerConnection = async (userIdToConnect: string) => {
        const mic = await getMicrophone();
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        const peerConnection = new RTCPeerConnection(configuration);
        connectionsRef.current.set(userIdToConnect, peerConnection);
        mic.getTracks().forEach((track) => {
            peerConnection.addTrack(track, mic);
        });
        let remoteMic: MediaStream;
        peerConnection.addEventListener("track", (event) => {
            remoteMic = event.streams[0];
        });
        peerConnection.addEventListener("connectionstatechange", () => {
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

    return joinedUsers.map((user) => <User key={user.id} {...user} />);
}
