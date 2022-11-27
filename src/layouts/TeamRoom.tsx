import JoinedUser from "components/JoinedUser";
import { useGameStateContext } from "contexts/GameState";
import { useSocketIOContext } from "contexts/SocketIO";
import { useEffect, useRef, useState } from "react";
import { Teammate, User } from "types/user";

export default function TeamRoom() {
    const socket = useSocketIOContext();
    const { teammates } = useGameStateContext();
    const [joinedUsers, setJoinedUsers] = useState<(User & Teammate)[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();

    const getMicrophone = async (micId?: string) => {
        const mic = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: micId },
        });
        return mic;
    };

    const createPeerConnection = async (id: string, summonerName: string) => {
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
                const user = copy.find((user) => user.summonerName === summonerName);
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
                        socketId: id,
                        summonerName,
                        micSrcObject: remoteMic,
                        ...teammates.find((teammate) => teammate.summonerName === summonerName),
                    },
                ]);
            }
            if (peerConnection.connectionState === "disconnected") {
                connectionsRef.current.delete(id);
                setJoinedUsers((users) => users.filter((user) => user.socketId !== id));
            }
        });
        return peerConnection;
    };

    useEffect(() => {
        connectionsRef.current = new Map();

        const onUserJoined = async ({ id, summonerName }) => {
            const peerConnection = await createPeerConnection(id, summonerName);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, id);
        };
        socket.on("userJoined", onUserJoined);

        const onOffer = async (offer: RTCSessionDescriptionInit, { id, summonerName }: any) => {
            const peerConnection = await createPeerConnection(id, summonerName);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, id);
        };
        socket.on("offer", onOffer);

        const onAnswer = async (answer: RTCSessionDescriptionInit, from: string) => {
            const remoteDesc = new RTCSessionDescription(answer);
            const peerConnection = connectionsRef.current.get(from);
            await peerConnection.setRemoteDescription(remoteDesc);
        };
        socket.on("answer", onAnswer);

        const onIceCandidate = async (iceCandidate: { candidate: string }, from: string) => {
            if (!iceCandidate) return;
            await connectionsRef.current.get(from)?.addIceCandidate(
                new RTCIceCandidate({
                    candidate: iceCandidate.candidate,
                    sdpMid: "",
                    sdpMLineIndex: 0,
                })
            );
        };
        socket.on("iceCandidate", onIceCandidate);

        return () => {
            socket.off("userJoined", onUserJoined);
            socket.off("offer", onOffer);
            socket.off("answer", onAnswer);
            socket.off("iceCandidate", onIceCandidate);
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

    //doesnt work on connected peers
    const changeMic = async (newMicId: string) => {
        setActiveMicId(newMicId);
        localStorage.setItem("defaultMic", newMicId);
        const newMic = await getMicrophone(newMicId);
        // connectionsRef.current.forEach((conn) => {
        //     conn.addTrack(newMic.getAudioTracks()[0], newMic);
        // });
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
                <JoinedUser key={user.socketId} {...user} />
            ))}
        </>
    );
}
