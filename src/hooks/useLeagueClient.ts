import { Command } from "@tauri-apps/api/shell";
import { invoke } from "@tauri-apps/api/tauri";
import { useAppInfoContext } from "contexts/AppInfo";
import { useEffect, useRef, useState } from "react";

interface ClientInfo {
    port: number;
    password: string;
}

export default function useLeagueClient() {
    const { isTauri } = useAppInfoContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isInMatch, setIsInMatch] = useState(false);
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

    const getGameflowPhase = async () => {
        const status: string = await getRequest("/lol-gameflow/v1/gameflow-phase");
        return status?.replaceAll('"', "");
    };

    useEffect(() => {
        if (!isTauri) return;
        let interval: NodeJS.Timer;
        if (!isOpen) {
            interval = setInterval(checkProcess, 3000);
        } else {
            interval = setInterval(async () => {
                const gameflow = await getGameflowPhase();
                setIsInMatch(gameflow === "InProgress");
            }, 1000);
        }
        return () => {
            clearInterval(interval);
        };
    }, [isOpen]);

    return {
        isInMatch,
    };
}
