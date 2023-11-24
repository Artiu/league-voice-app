import { createContext, useContext, useState } from "react";

interface Auth {
	summonerName: string;
	isLoggedIn: boolean;
	updateSummonerName: (newName: string) => void;
	logOut: () => void;
}

const AuthContext = createContext<Auth>(undefined);

export default function AuthContextProvider({ children }) {
	const loadSummonerName = () => {
		if (typeof window === "undefined") return;
		return localStorage.getItem("summonerName");
	};
	const [summonerName, setSummonerName] = useState(loadSummonerName);

	const updateSummonerName = (newName: string) => {
		localStorage.setItem("summonerName", newName);
		setSummonerName(newName);
	};

	const logOut = () => {
		localStorage.removeItem("summonerName");
		setSummonerName(null);
	};

	return (
		<AuthContext.Provider
			value={{ summonerName, isLoggedIn: !!summonerName, updateSummonerName, logOut }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuthContext = () => {
	return useContext(AuthContext);
};
