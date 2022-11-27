export interface User {
    socketId: string;
    summonerName: string;
    micSrcObject?: MediaStream;
}

export interface Teammate {
    championId: number;
    summonerName: string;
}
