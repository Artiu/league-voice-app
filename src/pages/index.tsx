import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

interface UserI {
    id: string;
    micSrcObject?: MediaProvider;
}

const socket = io("192.168.97.221:3001");

function User({ id, micSrcObject }: UserI) {
    const audioRef = useRef<HTMLAudioElement>();
    
    useEffect(() => {
        if(!micSrcObject) return;
        audioRef.current.srcObject = micSrcObject;
    }, [micSrcObject])

    return (
        <p>
            {id}
            {micSrcObject && ( 
                <audio ref={audioRef} />
            )}
        </p>
    );
}

export default function App() {
    const [joinedUsers, setJoinedUsers] = useState<UserI[]>([]);
    const connectionsRef = useRef<Map<string, RTCPeerConnection>>();
    const micRef = useRef<MediaStream>();

    useEffect(() => {
            getMicrophone();
            connectionsRef.current = new Map();
            const configuration = { iceServers: [{ urls: "stun:openrelay.metered.ca:80" }] };
            socket.on("userJoined", async (joinedUserId) => {
                const peerConnection = new RTCPeerConnection(configuration);
                connectionsRef.current.set(joinedUserId, peerConnection);
                peerConnection.addEventListener("track", (track) => {                
                    setJoinedUsers((users) => {
                        const usersCopy = [...users];
                        const user = usersCopy.find((user) => user.id === joinedUserId);
                        user.micSrcObject = new MediaStream(track.streams[0]);
                        return usersCopy;
                    })
                })
                peerConnection.addTrack(micRef.current.getAudioTracks()[0]);
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                setJoinedUsers((users) => [...users, { id: joinedUserId}]);
                socket.emit("offer", offer, joinedUserId);
            });
            socket.on("offer", async (offer, from) => {
                const peerConnection = new RTCPeerConnection(configuration);
                peerConnection.addEventListener("icecandidate", (event) => {
                    socket.emit("iceCandidate", event.candidate, from);
                })
                connectionsRef.current.set(from, peerConnection);
                peerConnection.addEventListener("track", (track) => {                    
                    setJoinedUsers((users) => {
                        const usersCopy = [...users];
                        const user = usersCopy.find((user) => user.id === from);
                        user.micSrcObject = track.streams[0];
                        return usersCopy;
                    })
                })
                if (connectionsRef.current.get(from)) return;
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                peerConnection.addTrack(micRef.current.getAudioTracks()[0]);
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                setJoinedUsers((users) => [...users, { id: from }]);
                socket.emit("answer", answer, from);
            });
            socket.on("answer", async (answer, from) => {
                const remoteDesc = new RTCSessionDescription(answer);
                const peerConnection = connectionsRef.current.get(from);
                await peerConnection.setRemoteDescription(remoteDesc);                
            });
            socket.on("iceCandidate", async (iceCandidate, from) => {
                await connectionsRef.current.get(from)?.addIceCandidate(iceCandidate);
            })
        return () => {
            socket.disconnect();
        };
    }, []);

    const getMicrophone = async () => {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        micRef.current = mic;
    };

    return joinedUsers.map((user) => <User key={user.id} {...user} />);
}
