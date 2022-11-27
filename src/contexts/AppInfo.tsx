import { getTauriVersion } from "@tauri-apps/api/app";
import { createContext, useContext, useEffect, useState } from "react";

interface AppInfo {
    isTauri: boolean;
}

const AppInfoContext = createContext<AppInfo>(undefined);

export default function AppInfoContextProvider({ children }) {
    const [isTauri, setIsTauri] = useState<boolean>();
    useEffect(() => {
        getTauriVersion()
            .then(() => setIsTauri(true))
            .catch(() => setIsTauri(false));
    }, []);

    if (isTauri === undefined) {
        return null;
    }

    return <AppInfoContext.Provider value={{ isTauri }}>{children}</AppInfoContext.Provider>;
}

export const useAppInfoContext = () => useContext(AppInfoContext);
