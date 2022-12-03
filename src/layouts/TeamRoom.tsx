import JoinedUser from "components/JoinedUser";
import { useGameStateContext } from "contexts/GameState";
import { useSocketIOContext } from "contexts/SocketIO";
import { useEffect, useRef, useState } from "react";
import { Teammate, User } from "types/user";

export default function TeamRoom() {
    const [activeMicId, setActiveMicId] = useState<string | undefined>(
        () => typeof window !== "undefined" && localStorage.getItem("defaultMic")
    );
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const activeMicRef = useRef<MediaStream>(new MediaStream());

    const updateMic = (micId: string) => {
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
            connectionsRef.current.forEach((conn) => {
                conn.getSenders().forEach((sender) => {
                    conn.removeTrack(sender);
                });
                conn.addTrack(mic.getAudioTracks()[0], mic);
            });
        })();
    }, [activeMicId]);

    useEffect(() => {
        navigator.mediaDevices.addEventListener("devicechange", updateMicrophones);
        updateMicrophones();
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", getMicrophones);
        };
    }, []);

    const socket = useSocketIOContext();
    const { teammates } = useGameStateContext();
    const [joinedUsers, setJoinedUsers] = useState<(User & Teammate)[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    const createPeerConnection = async (socketId: string, summonerName: string) => {
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        const peerConnection = new RTCPeerConnection(configuration);
        activeMicRef.current.getAudioTracks().forEach((track) => {
            peerConnection.addTrack(track, activeMicRef.current);
        });
        connectionsRef.current.set(socketId, peerConnection);
        setJoinedUsers((users) => [
            ...users,
            {
                socketId,
                summonerName,
                connectionState: peerConnection.connectionState,
                ...teammates.find((teammate) => teammate.summonerName === summonerName),
            },
        ]);
        peerConnection.ontrack = ({ track, streams }) => {
            track.onunmute = () => {
                setJoinedUsers((users) => {
                    const copy = [...users];
                    copy.map((user) => {
                        if (user.socketId === socketId) {
                            user.micSrcObject = streams[0];
                        }
                    });
                    return copy;
                });
            };
        };
        peerConnection.onnegotiationneeded = async () => {
            try {
                await peerConnection.setLocalDescription();
                socket.emit(
                    "signaling",
                    { description: peerConnection.localDescription },
                    socketId
                );
            } catch (err) {
                console.error(err);
            }
        };
        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === "failed") {
                peerConnection.restartIce();
            }
        };

        peerConnection.onicecandidate = ({ candidate }) => {
            socket.emit("signaling", { candidate }, socketId);
        };

        peerConnection.addEventListener("connectionstatechange", async () => {
            setJoinedUsers((users) => {
                const copy = [...users];
                copy.map((user) => {
                    if (user.socketId === socketId) {
                        user.connectionState = peerConnection.connectionState;
                    }
                });
                return copy;
            });
            if (
                peerConnection.connectionState === "failed" ||
                peerConnection.connectionState === "closed"
            ) {
                connectionsRef.current.delete(socketId);
                setJoinedUsers((users) => users.filter((user) => user.socketId !== socketId));
            }
        });
        return peerConnection;
    };

    const connectToPeer = async (
        description: RTCSessionDescriptionInit,
        candidate: RTCIceCandidateInit,
        authData: { id: string; summonerName: string }
    ) => {
        let peerConnection = connectionsRef.current.get(authData.id);
        if (!peerConnection) {
            peerConnection = await createPeerConnection(authData.id, authData.summonerName);
        }
        try {
            if (description) {
                await peerConnection.setRemoteDescription(description);
                if (description.type === "offer") {
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socket.emit(
                        "signaling",
                        { description: peerConnection.localDescription },
                        authData.id
                    );
                }
            } else if (candidate) {
                try {
                    await peerConnection.addIceCandidate(candidate);
                } catch (err) {
                    throw err;
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const onUserJoined = async ({ id, summonerName }) => {
            await createPeerConnection(id, summonerName);
        };
        socket.on("userJoined", onUserJoined);

        const onSignaling = async (
            { description, candidate },
            authData: { id: string; summonerName: string }
        ) => {
            await connectToPeer(description, candidate, authData);
        };
        socket.on("signaling", onSignaling);

        return () => {
            socket.off("userJoined", onUserJoined);
            socket.off("signaling", onSignaling);
        };
    }, []);

    return (
        <>
            <select value={activeMicId} onChange={(e) => updateMic(e.target.value)}>
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
