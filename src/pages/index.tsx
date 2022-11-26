import LoginForm from "components/LoginForm";
import { useGameStateContext } from "contexts/GameState";
import { useAuthContext } from "contexts/Auth";
import useLeagueClient from "hooks/useLeagueClient";
import TeamRoom from "layouts/TeamRoom";
import WaitingForLoLClient from "layouts/WaitingForLoLClient";
import WaitingForMatch from "layouts/WaitingForMatch";

export default function App() {
    // const { players, chatId, summonerId, isOpen, isInMatch } = useLeagueClient();
    const { isLoggedIn } = useAuthContext();
    const { isInMatch } = useGameStateContext();

    if (!isLoggedIn) {
        return <LoginForm />;
    }

    // if (!isOpen) {
    //     return <WaitingForLoLClient />;
    // }

    if (!isInMatch) {
        return <WaitingForMatch />;
    }

    return null;
    // return <TeamRoom players={players} chatId={chatId} summonerId={summonerId} />;
}
