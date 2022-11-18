export interface UserI {
    id: string;
    lane: Position;
    championId: number;
    micSrcObject?: MediaStream;
}

export type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "SUPPORT";
