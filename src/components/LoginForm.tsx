import { Button, Container, Flex, FormLabel, Input, Text } from "@chakra-ui/react";
import { useAuthContext } from "contexts/Auth";
import { FormEvent, useState } from "react";

export default function LoginForm() {
    const [summonerName, setSummonerName] = useState("");
    const { updateSummonerName } = useAuthContext();

    const submitForm = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateSummonerName(summonerName);
    };

    return (
        <Container>
            <form onSubmit={submitForm}>
                <FormLabel htmlFor="summonerName">Summoner Name</FormLabel>
                <Flex gap="4" alignItems="center">
                    <Input
                        type="text"
                        id="summonerName"
                        onChange={(e) => setSummonerName(e.target.value)}
                        value={summonerName}
                    />
                    <Text>EUNE</Text>
                </Flex>
                <Button type="submit" marginTop="3">
                    Log in
                </Button>
            </form>
        </Container>
    );
}
