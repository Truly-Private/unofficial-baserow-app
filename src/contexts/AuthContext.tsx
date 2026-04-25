import React, { createContext, useContext, useMemo } from "react";
import { ApiClient } from "../api/client";
import { refreshTokenIfNeeded } from "../api/auth";
import { getItem } from "../api/storage";

type AuthContextValue = {
  apiCall: <T>(fn: (c: ApiClient) => Promise<T>) => Promise<T>;
  client: ApiClient;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthContext not mounted");
  }
  return ctx;
};

// Simple provider that wires an ApiClient and exposes a light wrapper
// around API calls so UI components can stay framework-agnostic.
export const AuthProvider: React.FC<{ baseUrl?: string }> = ({
  children,
  baseUrl = "http://localhost:8000",
}) => {
  // Build a single shared API client instance
  const client = useMemo(() => new ApiClient({ baseUrl }), [baseUrl]);

  // Attempt to restore token from storage on mount
  React.useEffect(() => {
    (async () => {
      const token = await getItem("access_token");
      if (token) {
        client.setAccessToken(token);
      }
    })();
  }, [client]);

  const apiCall = async <T,>(fn: (c: ApiClient) => Promise<T>): Promise<T> => {
    // In a real app you would handle token refresh hierarchies here.
    try {
      return await fn(client);
    } catch (e) {
      // Try a refresh once on error if possible
      try {
        const ok = await refreshTokenIfNeeded(client);
        if (ok) {
          return await fn(client);
        }
      } catch {
        // ignore
      }
      throw e;
    }
  };

  const value: AuthContextValue = {
    apiCall,
    client,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
