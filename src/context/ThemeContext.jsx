import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => { },
    setTheme: () => { },
});

const STORAGE_KEY = "quizgen-theme";

function getInitialTheme() {
    if (typeof window === "undefined") return "light";
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
    } catch {
        /* ignore */
    }
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.style.colorScheme = theme;
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore */
        }
    }, [theme]);

    const setTheme = useCallback((next) => {
        setThemeState(next === "dark" ? "dark" : "light");
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeContext;
