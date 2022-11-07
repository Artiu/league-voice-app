import useLeagueClient from "hooks/useLeagueClient";
import TeamRoom from "layouts/TeamRoom";
import WaitingForLoLClient from "layouts/WaitingForLoLClient";
import WaitingForMatch from "layouts/WaitingForMatch";

export default function App() {
    const { isOpen, isInMatch } = useLeagueClient();

    if (!isOpen) {
        return <WaitingForLoLClient />;
    }

    if (!isInMatch) {
        return <WaitingForMatch />;
    }

    return <TeamRoom />;
}
