export interface User {
	socketId: string;
	summonerName: string;
	connectionState: RTCPeerConnectionState;
	micSrcObject?: MediaStream;
}

export interface Teammate {
	championId: number;
	summonerName: string;
}
