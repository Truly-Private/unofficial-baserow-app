import { ApiClient } from "./client";
import { Endpoints } from "./endpoints";

// Simple authentication helpers. Endpoints are expected to be provided by Endpoints.ts
// This module does not assume a specific backend contract beyond typical token-based auth.

export async function login(
  client: ApiClient,
  email: string,
  password: string,
): Promise<boolean> {
  // Use real Baserow endpoints
  const path = Endpoints.auth.login();
  const payload = { email, password };
  try {
    const res = await client.post(path, payload);
    // Support common token shapes
    const token = res?.token ?? res?.access ?? res?.jwt;
    const refresh = res?.refresh ?? res?.refresh_token;
    if (token) {
      // Persist tokens if a persistence layer exists
      await client.saveTokenPair(token, refresh);
      client.setAccessToken(token);
      if (refresh) client.setRefreshToken(refresh);
      return true;
    }
    return false;
  } catch (e) {
    // Propagate error for UI to handle
    throw e;
  }
}

export async function refreshTokenIfNeeded(
  client: ApiClient,
): Promise<boolean> {
  // Use real refresh endpoint if token exists
  const refreshPath = Endpoints.auth.refresh();
  if (!client) return false;
  // In a real app, you would check expiry before attempting refresh
  try {
    const res = await client.post(refreshPath, {});
    const access = res?.token ?? res?.access ?? res?.jwt;
    if (access) {
      client.setAccessToken(access);
      return true;
    }
  } catch {
    // refresh failed
  }
  return false;
}

export async function logout(client: ApiClient): Promise<void> {
  await client.clearTokens();
  client.setAccessToken(undefined);
  client.setRefreshToken(undefined);
}
