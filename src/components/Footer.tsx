import { Box, Button, Text } from "@chakra-ui/react";
import { useAppInfoContext } from "contexts/AppInfo";

export default function Footer() {
    const { isTauri } = useAppInfoContext();
    if (isTauri) return null;

    return (
        <Box display="flex" flexDirection="column" justifyContent="center" gap="2" padding="4">
            <Text fontSize="xl" fontWeight="semibold" textAlign="center">
                League Voice Official App
            </Text>
            <Button
                marginInline="auto"
                width="fit-content"
                as="a"
                href="https://api.league-voice.site/releases/LeagueVoice.msi"
                download
            >
                Download for Windows
            </Button>
        </Box>
    );
}
