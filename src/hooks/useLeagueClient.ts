import { Command } from "@tauri-apps/api/shell";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useRef, useState } from "react";
import { Position } from "types/user";

interface ClientInfo {
    port: number;
    password: string;
}

interface Player {
    summonerId: string;
    championId: number;
    assignedPosition: Position;
}

const INGAME_STATES = ["ChampSelect", "InProgress"];

export default function useLeagueClient() {
    const [isOpen, setIsOpen] = useState(false);
    const [summonerId, setSummonerId] = useState<string | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const clientInfo = useRef<ClientInfo>();

    const checkProcess = async () => {
        const command = new Command("get-league-process");
        const output = await command.execute();
        setIsOpen(!output.stderr);
        if (output.stderr || !output.stdout) return;
        const password = Buffer.from(
            `riot:${output.stdout.match(/remoting-auth-token=([^"]+)/)[1]}`
        ).toString("base64");
        const port = Number(output.stdout.match(/--app-port=([^"]+)/)[1]);
        clientInfo.current = { password, port };
    };

    const getRequest = async (path: string) => {
        const result: string = await invoke("get_from_lol_client", {
            path,
            port: clientInfo.current.port,
            password: clientInfo.current.password,
        });
        return result;
    };

    const getSummonerId = async () => {
        const summoner = await getRequest("/lol-summoner/v1/current-summoner");
        return JSON.parse(summoner).summonerId as string;
    };

    const getGameflowPhase = async () => {
        const status: string = await getRequest("/lol-gameflow/v1/gameflow-phase");
        return status.replaceAll('"', "");
    };

    const getChampSelect = async () => {
        const data = await getRequest("/lol-champ-select/v1/session");
        return JSON.parse(data);
    };

    const getPlayerFromChampSelect = async (summonerId: string): Promise<Player | undefined> => {
        const champSelect = await getChampSelect();
        return champSelect.myTeam.find((player: Player) => player.summonerId === summonerId);
    };

    useEffect(() => {
        checkProcess();
        const interval = setInterval(checkProcess, 3000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        getSummonerId().then((val) => setSummonerId(val));
        const interval = setInterval(async () => {
            const gameflow = await getGameflowPhase();
            if (!INGAME_STATES.includes(gameflow)) {
                setChatId(null);
                return;
            }
            const champSelect = await getChampSelect();
            setChatId(champSelect.chatDetails.chatRoomName);
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [isOpen]);

    return {
        isOpen,
        isInMatch: !!chatId,
        chatId,
        summonerId,
        getPlayerFromChampSelect,
    };
}
