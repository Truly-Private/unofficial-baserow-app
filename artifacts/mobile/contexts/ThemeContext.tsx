import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "user-theme-preference";

const isWeb = Platform.OS === "web";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    // Load persisted theme on mount
    const loadTheme = async () => {
      try {
        let savedTheme: string | null = null;
        if (isWeb) {
          savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        } else {
          savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        }

        if (
          savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system"
        ) {
          setThemeState(savedTheme as Theme);
        }
      } catch (e) {
        console.error("Failed to load theme preference", e);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      if (isWeb) {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } else {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
      }
    } catch (e) {
      console.error("Failed to save theme preference", e);
    }
  };

  const isDark =
    theme === "system" ? systemColorScheme === "dark" : theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
