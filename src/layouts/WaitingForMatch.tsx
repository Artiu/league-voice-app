import { useAppInfoContext } from "contexts/AppInfo";
import { useGameStateContext } from "contexts/GameState";

export default function WaitingForMatch() {
    const { isTauri } = useAppInfoContext();
    const { hasLeftCall, joinCall } = useGameStateContext();

    return (
        <>
            <p>{hasLeftCall ? "Match in progress" : "Waiting for match to start..."}</p>
            {(!isTauri || hasLeftCall) && (
                <button onClick={joinCall}>{hasLeftCall ? "Reconnect" : "Connect"}</button>
            )}
        </>
    );
}
