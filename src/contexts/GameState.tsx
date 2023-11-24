import { useToast } from "@chakra-ui/react";
import useLeagueClient from "hooks/useLeagueClient";
import { createContext, useContext, useEffect, useState } from "react";
import { Error } from "types/error";
import { Teammate } from "types/user";
import { useAppInfoContext } from "./AppInfo";
import { useSocketIOContext } from "./SocketIO";

interface GameState {
	teammates: Teammate[];
	isInMatch: boolean;
	hasLeftCall: boolean;
	leaveCall: () => void;
	joinCall: () => void;
}

const GameStateContext = createContext<GameState>(undefined);

export default function GameStateContextProvider({ children }) {
	const toast = useToast();
	const socket = useSocketIOContext();
	const { isInMatch } = useLeagueClient();
	const { isTauri } = useAppInfoContext();
	const [teammates, setTeammates] = useState<Teammate[]>([]);
	const [hasLeftCall, setHasLeftCall] = useState(false);

	const joinCall = () => {
		socket.emit("matchStart");
	};

	useEffect(() => {
		if (isInMatch && !hasLeftCall) {
			joinCall();
		}
	}, [isInMatch]);

	const leaveCall = () => {
		socket.emit("leaveCall");
		setTeammates([]);
		if (isTauri && isInMatch) {
			setHasLeftCall(true);
		}
	};

	useEffect(() => {
		if (isInMatch) return;
		setHasLeftCall(false);
	}, [isInMatch]);

	useEffect(() => {
		const onMatchStarted = (payload: Teammate[] | Error) => {
			if ((payload as Error).error === "account-currently-in-room") {
				toast({
					description:
						"You are currently in this call on different device. Only one device can be connected to call.",
					status: "info",
				});
				return;
			}
			setTeammates(payload as Teammate[]);
			setHasLeftCall(false);
		};
		socket.on("matchStarted", onMatchStarted);

		return () => {
			socket.off("matchStarted", onMatchStarted);
		};
	}, []);

	return (
		<GameStateContext.Provider
			value={{
				teammates,
				leaveCall,
				isInMatch: teammates.length > 0,
				hasLeftCall,
				joinCall,
			}}
		>
			{children}
		</GameStateContext.Provider>
	);
}

export const useGameStateContext = () => {
	return useContext(GameStateContext);
};
