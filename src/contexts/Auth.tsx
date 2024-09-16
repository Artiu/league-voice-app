import { createContext, useContext, useState } from "react";

interface Auth {
	riotId: string;
	isLoggedIn: boolean;
	updateRiotId: (riotId: string) => void;
	logOut: () => void;
}

const AuthContext = createContext<Auth>(undefined);

export default function AuthContextProvider({ children }) {
	const loadRiotId = () => {
		if (typeof window === "undefined") return;
		return localStorage.getItem("riotId");
	};
	const [riotId, setRiotId] = useState(loadRiotId);

	const updateRiotId = (newRiotId: string) => {
		localStorage.setItem("riotId", newRiotId);
		setRiotId(newRiotId);
	};

	const logOut = () => {
		localStorage.removeItem("riotId");
		setRiotId(null);
	};

	return (
		<AuthContext.Provider value={{ riotId, isLoggedIn: !!riotId, updateRiotId, logOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuthContext = () => {
	return useContext(AuthContext);
};
