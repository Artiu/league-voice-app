import { useAppInfoContext } from "contexts/AppInfo";
import { useSocketIOContext } from "contexts/SocketIO";
import useLeagueClient from "hooks/useLeagueClient";
import { useEffect } from "react";

export default function WaitingForMatch() {
    const socket = useSocketIOContext();
    const { isTauri } = useAppInfoContext();
    const { isInMatch } = useLeagueClient();

    const onMatchStarted = () => {
        socket.emit("matchStart");
    };

    useEffect(() => {
        if (!isInMatch) return;
        onMatchStarted();
    }, [isInMatch]);

    return (
        <>
            <p>Waiting for match to start...</p>
            {!isTauri && <button onClick={onMatchStarted}>Refresh</button>}
        </>
    );
}
