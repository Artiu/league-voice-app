import { Button } from "@chakra-ui/react";
import { useAuthContext } from "contexts/Auth";

export default function LogoutButton() {
	const { logOut, isLoggedIn } = useAuthContext();
	if (!isLoggedIn) {
		return null;
	}
	return <Button onClick={logOut}>Log out</Button>;
}
