export interface UserI {
    id: string;
    summonerId: string;
    micSrcObject?: MediaStream;
}

export interface Player {
    summonerId: string;
    championId: number;
    assignedPosition: Position;
}

export type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "SUPPORT";
