import useAuth from "hooks/useAuth";
import { FormEvent, useState } from "react";

export default function LoginForm() {
    const [summonerName, setSummonerName] = useState("");
    const { updateSummonerName } = useAuth();

    const submitForm = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateSummonerName(summonerName);
    };

    return (
        <form onSubmit={submitForm}>
            <label htmlFor="summonerName">Summoner Name</label>
            <input
                type="text"
                className="summonerName"
                onChange={(e) => setSummonerName(e.target.value)}
                value={summonerName}
            />
            <button type="submit">Log in</button>
        </form>
    );
}
