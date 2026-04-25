import { getItem, setItem, removeItem } from "./storage";

export interface ApiClientOptions {
  baseUrl: string;
}

export class ApiClient {
  private baseUrl: string;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
  }

  setAccessToken(token?: string) {
    this.accessToken = token;
  }

  setRefreshToken(token?: string) {
    this.refreshToken = token;
  }

  async loginWithStoredToken(): Promise<boolean> {
    const token = await getItem("access_token");
    if (token) {
      this.accessToken = token;
      return true;
    }
    return false;
  }

  async saveTokenPair(access: string, refresh?: string) {
    this.accessToken = access;
    if (refresh) this.refreshToken = refresh;
    if (access) await setItem("access_token", access);
    if (refresh) await setItem("refresh_token", refresh);
  }

  async clearTokens() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
    await removeItem("access_token");
    await removeItem("refresh_token");
  }

  private async buildUrl(
    path: string,
    params?: Record<string, any>,
  ): Promise<string> {
    let url = `${this.baseUrl}${path.startsWith("/") ? path : "/" + path}`;
    if (params && Object.keys(params).length) {
      const q = new URLSearchParams(params as any).toString();
      url += `?${q}`;
    }
    return url;
  }

  async request(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>,
  ): Promise<any> {
    const url = await this.buildUrl(path, params);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = resp.headers.get("content-type") || "";
    let data: any;
    if (contentType.includes("application/json")) {
      data = await resp.json();
    } else {
      data = await resp.text();
    }

    if (!resp.ok) {
      const message = data?.detail || data?.message || resp.statusText;
      throw new Error(`API error ${resp.status}: ${message}`);
    }

    return data;
  }

  // Convenience helpers
  get(path: string, params?: Record<string, any>) {
    return this.request("GET", path, undefined, params);
  }
  post(path: string, body?: any) {
    return this.request("POST", path, body);
  }
  put(path: string, body?: any) {
    return this.request("PUT", path, body);
  }
  patch(path: string, body?: any) {
    return this.request("PATCH", path, body);
  }
  delete(path: string) {
    return this.request("DELETE", path);
  }
}
