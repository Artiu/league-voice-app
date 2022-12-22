import { useSocketIOContext } from "contexts/SocketIO";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { User } from "types/user";

interface useWebRTCProps {
    micRef: MutableRefObject<MediaStream>;
}

export default function useWebRTC({ micRef }: useWebRTCProps) {
    const socket = useSocketIOContext();

    const [joinedUsers, setJoinedUsers] = useState<User[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    const createPeerConnection = async (socketId: string, summonerName: string) => {
        const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
        const peerConnection = new RTCPeerConnection(configuration);
        micRef.current.getAudioTracks().forEach((track) => {
            peerConnection.addTrack(track, micRef.current);
        });
        const prevConnection = connectionsRef.current.get(socketId);
        if (prevConnection) {
            prevConnection.close();
            setJoinedUsers((users) => users.filter((user) => user.socketId !== socketId));
        }
        connectionsRef.current.set(socketId, peerConnection);
        setJoinedUsers((users) => [
            ...users,
            {
                socketId,
                summonerName,
                connectionState: peerConnection.connectionState,
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

    const changeAudioForAllPeers = (newAudio: MediaStream) => {
        connectionsRef.current.forEach((conn) => {
            conn.getSenders().forEach((sender) => {
                conn.removeTrack(sender);
            });
            conn.addTrack(newAudio.getAudioTracks()[0], newAudio);
        });
    };

    useEffect(() => {
        const onSignaling = async (
            { description, candidate },
            authData: { id: string; summonerName: string }
        ) => {
            await connectToPeer(description, candidate, authData);
        };
        socket.on("signaling", onSignaling);

        return () => {
            socket.off("signaling", onSignaling);
            connectionsRef.current.forEach((conn) => {
                conn.close();
            });
        };
    }, []);

    useEffect(() => {
        const onUserJoined = async ({ id, summonerName }) => {
            const existingConnectedUser = joinedUsers.find(
                (user) => user.summonerName === summonerName
            );

            if (existingConnectedUser) {
                const peerConnection = connectionsRef.current.get(existingConnectedUser.socketId);
                connectionsRef.current.delete(existingConnectedUser.socketId);
                connectionsRef.current.set(id, peerConnection);
                setJoinedUsers((users) => [
                    ...users.filter((user) => user.summonerName !== summonerName),
                    { ...existingConnectedUser, socketId: id },
                ]);
                return;
            }
            await createPeerConnection(id, summonerName);
        };
        socket.on("userJoined", onUserJoined);

        const onUserLeft = ({ id }) => {
            const conn = connectionsRef.current.get(id);
            setJoinedUsers((users) => users.filter((user) => user.socketId !== id));
            if (!conn) return;
            conn.close();
            connectionsRef.current.delete(id);
        };
        socket.on("userLeft", onUserLeft);

        return () => {
            socket.off("userJoined", onUserJoined);
            socket.off("userLeft", onUserLeft);
        };
    }, [joinedUsers]);

    return {
        joinedUsers,
        changeAudioForAllPeers,
    };
}
