import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

interface UserI {
    id: string;
    micSrcObject: string;
}

const socket = io("192.168.0.115:3001");

function User({ id, micSrcObject }: UserI) {
    const audioRef = useRef();
    return (
        <p>
            {id}
            <audio ref={audioRef} />
        </p>
    );
}

export default function App() {
    const [joinedUsers, setJoinedUsers] = useState<UserI[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();

    useEffect(() => {
        connectionsRef.current = new Map();
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        socket.on("userJoined", async (joinedUserId) => {
            const peerConnection = new RTCPeerConnection(configuration);
            const mic = await getMicrophone();
            peerConnection.addTrack(mic.getAudioTracks()[0]);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            peerConnection.addEventListener("connectionstatechange", () => {
                if (peerConnection.connectionState === "new") {
                    setJoinedUsers((users) => [...users, joinedUserId]);
                }
                if (peerConnection.connectionState === "closed") {
                    connectionsRef.current.delete(joinedUserId);
                    setJoinedUsers((users) => users.filter((userId) => userId !== joinedUserId));
                }
            });
            connectionsRef.current.set(joinedUserId, peerConnection);
            socket.emit("offer", offer, joinedUserId);
        });
        socket.on("offer", async (offer, from) => {
            const peerConnection = new RTCPeerConnection(configuration);
            if (connectionsRef.current.get(from)) return;
            peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            peerConnection.addEventListener("connectionstatechange", () => {
                if (peerConnection.connectionState === "connected") {
                    setJoinedUsers((users) => [...users, from]);
                }
                if (peerConnection.connectionState === "closed") {
                    connectionsRef.current.delete(from);
                    setJoinedUsers((users) => users.filter((userId) => userId !== from));
                }
            });
            connectionsRef.current.set(from, peerConnection);
            socket.emit("answer", answer, from);
        });
        socket.on("answer", async (answer, from) => {
            const remoteDesc = new RTCSessionDescription(answer);
            const peerConnection = connectionsRef.current.get(from);
            await peerConnection.setRemoteDescription(remoteDesc);
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    const getMicrophone = async () => {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    };

    return joinedUsers.map((user) => <User {...user} />);
}
