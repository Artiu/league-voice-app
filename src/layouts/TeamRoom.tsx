import JoinedUser from "components/JoinedUser";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { UserI } from "types/User";

const socket = io("192.168.0.115:3001");

export default function TeamRoom() {
    const [joinedUsers, setJoinedUsers] = useState<UserI[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();

    const getMicrophone = async (micId?: string) => {
        const mic = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: micId },
        });
        return mic;
    };

    const createPeerConnection = async (userIdToConnect: string) => {
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        const peerConnection = new RTCPeerConnection(configuration);
        const localMic = await getMicrophone(localStorage.getItem("defaultMic"));
        peerConnection.addTrack(localMic.getAudioTracks()[0], localMic);
        connectionsRef.current.set(userIdToConnect, peerConnection);
        let remoteMic: MediaStream;
        peerConnection.addEventListener("icecandidate", (event) => {
            socket.emit("iceCandidate", event.candidate, userIdToConnect);
        });
        peerConnection.addEventListener("track", (event) => {
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
            if (!iceCandidate) return;
            await connectionsRef.current.get(from)?.addIceCandidate(
                new RTCIceCandidate({
                    candidate: iceCandidate.candidate,
                    sdpMid: "",
                    sdpMLineIndex: 0,
                })
            );
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
            {joinedUsers.map((user) => (
                <JoinedUser key={user.id} {...user} />
            ))}
        </>
    );
}
