import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
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
import { Platform } from "react-native";

import {
  BaserowApiError,
  DEFAULT_BASEROW_URL,
  login as baserowLogin,
  refreshAuth,
  type BaserowCredentials,
  type BaserowUser,
} from "@/lib/baserow";

const LEGACY_STORAGE_KEY = "baserow.auth.v1";
const META_STORAGE_KEY = "baserow.auth.meta.v1";
const JWT_SECURE_KEY = "baserow_auth_jwt_v1";
const REFRESH_SECURE_KEY = "baserow_auth_refresh_v1";

type StoredMeta = {
  baseUrl: string;
  user: BaserowUser;
};

type LegacyStoredAuth = {
  baseUrl: string;
  jwt: string;
  refreshToken: string;
  user: BaserowUser;
};

const isWeb = Platform.OS === "web";

async function setSecret(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getSecret(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecret(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function writeAuth(
  baseUrl: string,
  user: BaserowUser,
  jwt: string,
  refreshToken: string,
): Promise<void> {
  const meta: StoredMeta = { baseUrl, user };
  await Promise.all([
    AsyncStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta)),
    setSecret(JWT_SECURE_KEY, jwt),
    setSecret(REFRESH_SECURE_KEY, refreshToken),
  ]);
}

async function clearAuth(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(META_STORAGE_KEY),
    AsyncStorage.removeItem(LEGACY_STORAGE_KEY),
    deleteSecret(JWT_SECURE_KEY),
    deleteSecret(REFRESH_SECURE_KEY),
  ]);
}

async function migrateLegacyAuth(): Promise<LegacyStoredAuth | null> {
  const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LegacyStoredAuth;
    if (parsed?.jwt && parsed?.baseUrl && parsed?.user) {
      await writeAuth(
        parsed.baseUrl,
        parsed.user,
        parsed.jwt,
        parsed.refreshToken ?? "",
      );
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return parsed;
    }
  } catch {
    // Fall through and clean up the broken legacy entry below.
  }
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  return null;
}

async function loadStoredCreds(): Promise<BaserowCredentials | null> {
  const metaRaw = await AsyncStorage.getItem(META_STORAGE_KEY);
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as StoredMeta;
      const [jwt, refreshToken] = await Promise.all([
        getSecret(JWT_SECURE_KEY),
        getSecret(REFRESH_SECURE_KEY),
      ]);
      if (meta?.baseUrl && meta?.user && jwt) {
        return {
          baseUrl: meta.baseUrl,
          user: meta.user,
          jwt,
          refreshToken: refreshToken ?? "",
        };
      }
      // Metadata exists but the secure token is missing or unreadable —
      // clear the stale metadata so we don't leave residual auth state behind.
      await AsyncStorage.removeItem(META_STORAGE_KEY);
      await deleteSecret(JWT_SECURE_KEY);
      await deleteSecret(REFRESH_SECURE_KEY);
    } catch {
      // Corrupt metadata blob — clean it up before falling through.
      await AsyncStorage.removeItem(META_STORAGE_KEY);
    }
  }

  const legacy = await migrateLegacyAuth();
  if (legacy) {
    return {
      baseUrl: legacy.baseUrl,
      user: legacy.user,
      jwt: legacy.jwt,
      refreshToken: legacy.refreshToken ?? "",
    };
  }

  return null;
}

type AuthContextValue = {
  status: "loading" | "signedOut" | "signedIn";
  creds: BaserowCredentials | null;
  /** Convenience shortcut — same as creds?.user */
  user: BaserowUser | null;
  signIn: (params: {
    baseUrl: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  apiCall: <T>(fn: (creds: BaserowCredentials) => Promise<T>) => Promise<T>;
  /** Optimistically update local user object (e.g. after profile edit) */
  updateUser: (user: Partial<BaserowUser>) => void;
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
        const loaded = await loadStoredCreds();
        if (!mounted) return;
        if (loaded) {
          setCreds(loaded);
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
      await writeAuth(cleanUrl, res.user, res.token, res.refresh_token);
      setCreds({
        baseUrl: cleanUrl,
        jwt: res.token,
        refreshToken: res.refresh_token,
        user: res.user,
      });
      setStatus("signedIn");
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearAuth();
    credsRef.current = null;
    setCreds(null);
    setStatus("signedOut");
  }, []);

  const updateUser = useCallback((partial: Partial<BaserowUser>) => {
    setCreds((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, user: { ...prev.user, ...partial } };
      credsRef.current = merged;
      // Persist the updated user metadata
      writeAuth(merged.baseUrl, merged.user, merged.jwt, merged.refreshToken).catch(() => {});
      return merged;
    });
  }, []);

  const tryRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshInflight.current) return refreshInflight.current;
    const current = credsRef.current;
    if (!current?.refreshToken) return null;
    const promise = (async () => {
      try {
        const res = await refreshAuth(current.baseUrl, current.refreshToken);
        const updated: BaserowCredentials = { ...current, jwt: res.token };
        await setSecret(JWT_SECURE_KEY, res.token);
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
    () => ({ status, creds, user: creds?.user ?? null, signIn, signOut, apiCall, updateUser }),
    [status, creds, signIn, signOut, apiCall, updateUser],
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
