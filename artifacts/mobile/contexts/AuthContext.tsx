import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  BaserowApiError,
  DEFAULT_BASEROW_URL,
  login as baserowLogin,
  refreshAuth,
  type BaserowCredentials,
  type BaserowUser,
} from "@/lib/baserow";

const STORAGE_KEY = "baserow.auth.v1";

type StoredAuth = {
  baseUrl: string;
  jwt: string;
  refreshToken: string;
  user: BaserowUser;
};

type AuthContextValue = {
  status: "loading" | "signedOut" | "signedIn";
  creds: BaserowCredentials | null;
  signIn: (params: {
    baseUrl: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  apiCall: <T>(fn: (creds: BaserowCredentials) => Promise<T>) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "signedOut" | "signedIn">(
    "loading",
  );
  const [creds, setCreds] = useState<BaserowCredentials | null>(null);
  const credsRef = useRef<BaserowCredentials | null>(null);
  const refreshInflight = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    credsRef.current = creds;
  }, [creds]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (!raw) {
          setStatus("signedOut");
          return;
        }
        const parsed = JSON.parse(raw) as StoredAuth;
        if (parsed?.jwt && parsed?.baseUrl && parsed?.user) {
          setCreds({
            baseUrl: parsed.baseUrl,
            jwt: parsed.jwt,
            refreshToken: parsed.refreshToken,
            user: parsed.user,
          });
          setStatus("signedIn");
        } else {
          setStatus("signedOut");
        }
      } catch {
        if (!mounted) return;
        setStatus("signedOut");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(
    async ({
      baseUrl,
      email,
      password,
    }: {
      baseUrl: string;
      email: string;
      password: string;
    }) => {
      const cleanUrl = (baseUrl || DEFAULT_BASEROW_URL).trim().replace(/\/+$/, "");
      const res = await baserowLogin(cleanUrl, email.trim(), password);
      const stored: StoredAuth = {
        baseUrl: cleanUrl,
        jwt: res.token,
        refreshToken: res.refresh_token,
        user: res.user,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setCreds({
        baseUrl: stored.baseUrl,
        jwt: stored.jwt,
        refreshToken: stored.refreshToken,
        user: stored.user,
      });
      setStatus("signedIn");
    },
    [],
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    credsRef.current = null;
    setCreds(null);
    setStatus("signedOut");
  }, []);

  const tryRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshInflight.current) return refreshInflight.current;
    const current = credsRef.current;
    if (!current?.refreshToken) return null;
    const promise = (async () => {
      try {
        const res = await refreshAuth(current.baseUrl, current.refreshToken);
        const updated: BaserowCredentials = { ...current, jwt: res.token };
        const stored: StoredAuth = {
          baseUrl: updated.baseUrl,
          jwt: updated.jwt,
          refreshToken: updated.refreshToken,
          user: updated.user,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        credsRef.current = updated;
        setCreds(updated);
        return res.token;
      } catch {
        return null;
      } finally {
        refreshInflight.current = null;
      }
    })();
    refreshInflight.current = promise;
    return promise;
  }, []);

  const apiCall = useCallback(
    async <T,>(fn: (creds: BaserowCredentials) => Promise<T>): Promise<T> => {
      const current = credsRef.current;
      if (!current) throw new Error("Not signed in");
      try {
        return await fn(current);
      } catch (err) {
        if (err instanceof BaserowApiError && err.status === 401) {
          const newJwt = await tryRefresh();
          if (newJwt) {
            const updatedCreds = credsRef.current;
            if (updatedCreds) {
              try {
                return await fn(updatedCreds);
              } catch (retryErr) {
                if (
                  retryErr instanceof BaserowApiError &&
                  retryErr.status === 401
                ) {
                  await signOut();
                  router.replace("/login");
                }
                throw retryErr;
              }
            }
          }
          await signOut();
          router.replace("/login");
        }
        throw err;
      }
    },
    [tryRefresh, signOut],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, creds, signIn, signOut, apiCall }),
    [status, creds, signIn, signOut, apiCall],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useCreds(): BaserowCredentials {
  const { creds } = useAuth();
  if (!creds) throw new Error("Not signed in");
  return creds;
}
