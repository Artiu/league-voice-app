import LoginForm from "components/LoginForm";
import { useGameStateContext } from "contexts/GameState";
import { useAuthContext } from "contexts/Auth";
import TeamRoom from "layouts/TeamRoom";
import WaitingForMatch from "layouts/WaitingForMatch";

export default function App() {
    const { isLoggedIn } = useAuthContext();
    const { isInMatch } = useGameStateContext();

    if (!isLoggedIn) {
        return <LoginForm />;
    }

    if (!isInMatch) {
        return <WaitingForMatch />;
    }

    return <TeamRoom />;
}
