import JoinedUser from "components/JoinedUser";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Player, UserI } from "types/user";

interface TeamRoomProps {
    players: Player[];
    chatId: string;
    summonerId: string;
}

const socket = io("192.168.0.115:3001", { autoConnect: false });

export default function TeamRoom({ players, chatId, summonerId }: TeamRoomProps) {
    const [joinedUsers, setJoinedUsers] = useState<UserI[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();

    const connectedPlayers = useMemo(
        () =>
            joinedUsers.map((user) => ({
                ...user,
                ...players.find((player) => player.summonerId === user.summonerId),
            })),
        [players, joinedUsers]
    );

    const getPlayerFromChampSelect = (summmonerId: string) => {
        return players.find((player) => player.summonerId === summmonerId);
    };

    const getMicrophone = async (micId?: string) => {
        const mic = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: micId },
        });
        return mic;
    };

    const createPeerConnection = async (id: string, summonerId: string) => {
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        const peerConnection = new RTCPeerConnection(configuration);
        const localMic = await getMicrophone(localStorage.getItem("defaultMic"));
        peerConnection.addTrack(localMic.getAudioTracks()[0], localMic);
        connectionsRef.current.set(id, peerConnection);
        let remoteMic: MediaStream;
        peerConnection.addEventListener("icecandidate", (event) => {
            socket.emit("iceCandidate", event.candidate, id);
        });
        peerConnection.addEventListener("track", (event) => {
            remoteMic = event.streams[0];
            setJoinedUsers((users) => {
                const copy = [...users];
                const user = copy.find((user) => user.id === id);
                if (!user) return copy;
                user.micSrcObject = remoteMic;
                return copy;
            });
        });
        peerConnection.addEventListener("connectionstatechange", async () => {
            if (peerConnection.connectionState === "connected") {
                setJoinedUsers((users) => [
                    ...users,
                    {
                        id,
                        summonerId,
                        micSrcObject: remoteMic,
                    },
                ]);
            }
            if (peerConnection.connectionState === "disconnected") {
                connectionsRef.current.delete(id);
                setJoinedUsers((users) => users.filter((user) => user.id !== id));
            }
        });
        return peerConnection;
    };

    useEffect(() => {
        if (!chatId) return;
        socket.auth = { token: summonerId };
        connectionsRef.current = new Map();
        socket.on("userJoined", async ({ id, token }) => {
            const player = getPlayerFromChampSelect(token);
            if (!player) return;
            const peerConnection = await createPeerConnection(id, token);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, id);
        });
        socket.on("offer", async (offer, { id, token }) => {
            const player = getPlayerFromChampSelect(token);
            if (!player) return;
            const peerConnection = await createPeerConnection(id, token);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, id);
        });
        socket.on("answer", async (answer, from) => {
            const remoteDesc = new RTCSessionDescription(answer);
            const peerConnection = connectionsRef.current.get(from);
            await peerConnection.setRemoteDescription(remoteDesc);
        });
        socket.on("iceCandidate", async (iceCandidate, from) => {
            if (!iceCandidate) return;
            await connectionsRef.current.get(from)?.addIceCandidate(
                new RTCIceCandidate({
                    candidate: iceCandidate.candidate,
                    sdpMid: "",
                    sdpMLineIndex: 0,
                })
            );
        });
        socket.connect();
        socket.emit("matchStart", chatId);
        return () => {
            socket.disconnect();
        };
    }, [chatId]);

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

    //doesnt work on connected peers
    const changeMic = async (newMicId: string) => {
        setActiveMicId(newMicId);
        localStorage.setItem("defaultMic", newMicId);
        const newMic = await getMicrophone(newMicId);
        connectionsRef.current.forEach((conn) => {
            conn.addTrack(newMic.getAudioTracks()[0], newMic);
        });
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
            {connectedPlayers.map((user) => (
                <JoinedUser key={user.id} {...user} />
            ))}
        </>
    );
}
