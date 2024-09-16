export interface User {
	socketId: string;
	riotId: string;
	connectionState: RTCPeerConnectionState;
	micSrcObject?: MediaStream;
}

export interface Teammate {
	championId: number;
	riotId: string;
}
