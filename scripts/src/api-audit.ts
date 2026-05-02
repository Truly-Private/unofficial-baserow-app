#!/usr/bin/env tsx
/**
 * api-audit.ts  v3
 *
 * Audits every Baserow API endpoint against:
 *   1. The running app proxy at http://localhost:3000  (does the app handle it?)
 *   2. Functions implemented in artifacts/mobile/lib/  (is it coded at all?)
 *
 * Usage:
 *   cd scripts && pnpm tsx src/api-audit.ts
 *   pnpm tsx src/api-audit.ts --section "Notifications"
 *   pnpm tsx src/api-audit.ts --no-http          # skip HTTP calls, just show gaps
 *   pnpm tsx src/api-audit.ts --token JWT_TOKEN  # skip auth login
 *
 * Outputs:
 *   api-audit-report.md   — human-readable markdown with gap analysis
 *   api-audit-raw.json    — machine-readable per-endpoint JSON
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ─── Config ────────────────────────────────────────────────────────────────

const SPEC_PATH = path.join(ROOT, "Baserow API spec.json");
const BASEROW_API = "https://api.baserow.io";
const APP_BASE = "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "testerson@binkmail.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "roshyf-rYqmyp-joggo4";

function getArg(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? (process.argv[i + 1] ?? null) : null;
}
const SECTION_FILTER = getArg("--section");
const TOKEN_ARG = getArg("--token");
const NO_HTTP = process.argv.includes("--no-http");

// ─── Types ─────────────────────────────────────────────────────────────────

interface OpenAPISpec {
  paths: Record<string, Record<string, Operation>>;
}
interface Operation {
  tags?: string[];
  summary?: string;
  operationId?: string;
  parameters?: Parameter[];
  security?: unknown[];
}
interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: { type?: string; example?: unknown; default?: unknown };
  example?: unknown;
}
interface EndpointResult {
  tag: string;
  method: string;
  path: string;
  summary: string;
  operationId: string;
  requiresAuth: boolean;
  appStatus: number | "SKIP" | "ERROR";
  apiStatus: number | "SKIP" | "ERROR";
  appResponds: boolean;
  apiAccepts: boolean;
  error?: string;
  implementedIn?: string;
  matchType?: "exact" | "fuzzy";
}

// ─── Implementation Detection ───────────────────────────────────────────────
//
// Strategy:
//   1. Scan all lib/*.ts files and extract every exported function name +
//      the URL strings it contains.
//   2. For each function, infer the HTTP method from name/body.
//   3. Store normalised "skeleton" URLs (path params → *) for matching.
//   4. For each spec endpoint, try to find a matching fn by skeleton+method.

interface ImplFn {
  name: string;
  file: string;
  method: string;
  skeletons: string[]; // normalised URL skeletons
}

function normSkeleton(url: string): string {
  return url
    .replace(/\?.*$/, "")           // drop query string
    .replace(/\/$/, "")             // drop trailing slash
    .replace(/\$\{[^}]+\}/g, "*")  // template vars → *
    .replace(/\{[^}]+\}/g, "*")    // OpenAPI vars → *
    // Strip the bare domain wrapper used by AI assistant functions:
    // creds.baseUrl.replace(/\/api$/, "") + "/assistant/..."
    .replace(/^.*\.replace\([^)]+\)\s*\+\s*[`'"]/, "")
    .toLowerCase()
    .replace(/\/+$/, "");
}

function inferHTTPMethod(name: string, body: string): string {
  const b = body.toLowerCase();
  if (/method:\s*["']delete["']/i.test(b)) return "DELETE";
  if (/method:\s*["']patch["']/i.test(b)) return "PATCH";
  if (/method:\s*["']put["']/i.test(b)) return "PUT";
  if (/method:\s*["']post["']/i.test(b)) return "POST";
  const n = name.toLowerCase();
  if (/^(delete|remove|clear)/.test(n)) return "DELETE";
  if (/^(update|edit|patch)/.test(n)) return "PATCH";
  if (/^(replace|put)/.test(n)) return "PUT";
  const postPrefixes = ["create","add","send","post","publish","install","order","move","dispatch","upload","duplicate","cancel","ask","test","simulate","submit","import","mark","trigger","run","start","generate","invite","restore","refresh","token"];
  if (postPrefixes.some((p) => n.startsWith(p))) return "POST";
  return "GET";
}

function scanLibFiles(): ImplFn[] {
  const libs = [
    { file: path.join(ROOT, "artifacts/mobile/lib/baserow.ts"), label: "baserow.ts" },
    { file: path.join(ROOT, "artifacts/mobile/lib/admin.ts"), label: "admin.ts" },
  ];
  const results: ImplFn[] = [];

  for (const { file, label } of libs) {
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, "utf8");

    // Split source into function chunks by finding "export async function" boundaries
    const fnStarts: Array<{ name: string; start: number }> = [];
    const nameRx = /^export async function (\w+)/gm;
    let m: RegExpExecArray | null;
    while ((m = nameRx.exec(src)) !== null) {
      fnStarts.push({ name: m[1], start: m.index });
    }

    for (let i = 0; i < fnStarts.length; i++) {
      const { name, start } = fnStarts[i];
      const end = i + 1 < fnStarts.length ? fnStarts[i + 1].start : src.length;
      const body = src.slice(start, end);

      const method = inferHTTPMethod(name, body);

      // Extract all URL strings from the body.
      // Pattern 1: /api/ prefix (most functions)
      // Pattern 2: /assistant/ prefix (AI assistant — no /api/ prefix in spec)
      // Pattern 3: /row_comments/ prefix (row comments)
      const urlRx = /(?:^|[^a-zA-Z0-9_])((?:`|'|")(?:\/api\/|\/assistant\/|\/row_comments\/)[^`'"]+(?:`|'|"))/gm;
      const skeletons: string[] = [];
      let um: RegExpExecArray | null;
      while ((um = urlRx.exec(body)) !== null) {
        const raw = um[1].slice(1, -1); // strip surrounding quotes/backtick
        // Skip strings that look like partial/incomplete
        if (raw.includes("${") && !raw.includes("}/") && !raw.endsWith("}/")) continue;
        const skel = normSkeleton(raw);
        if (skel && !skeletons.includes(skel)) {
          skeletons.push(skel);
        }
      }

      // Also capture assistant URLs constructed via string concatenation:
      // `${creds.baseUrl.replace(...)} + "/assistant/chat/..."`
      const concatRx = /[+]\s*[`'"](\/assistant\/[^`'"]+)[`'"]/gm;
      while ((um = concatRx.exec(body)) !== null) {
        const skel = normSkeleton(um[1]);
        if (skel && !skeletons.includes(skel)) skeletons.push(skel);
      }

      // Also capture assistant URLs embedded mid-template-literal:
      // `${baseUrl.replace(...)}/assistant/chat/${uuid}/messages/`
      // Allow ${...} variable segments within the path.
      const midTemplateRx = /}((?:\/[^`'"\s/]+)+\/)/gm;
      while ((um = midTemplateRx.exec(body)) !== null) {
        const segment = um[1];
        if (!segment.startsWith("/assistant/") && !segment.startsWith("/_health/")) continue;
        const skel = normSkeleton(segment);
        if (skel && !skeletons.includes(skel)) skeletons.push(skel);
      }


      if (skeletons.length > 0) {
        results.push({ name, file: label, method, skeletons });
      }
    }
  }
  return results;
}

function findImpl(
  specMethod: string,
  specPath: string,
  implFns: ImplFn[]
): { impl: string; matchType: "exact" | "fuzzy" } | null {
  const targetSkel = normSkeleton(specPath);
  const targetMethod = specMethod.toUpperCase();

  // 1. Exact skeleton + method
  for (const fn of implFns) {
    if (fn.method === targetMethod && fn.skeletons.includes(targetSkel)) {
      return { impl: `${fn.name} (${fn.file})`, matchType: "exact" };
    }
  }

  // 2. Exact skeleton, any method
  for (const fn of implFns) {
    if (fn.skeletons.includes(targetSkel)) {
      return { impl: `${fn.name}? (${fn.file}) [method:${fn.method}]`, matchType: "fuzzy" };
    }
  }

  // 3. Segment-level fuzzy: split by "/" and compare non-wildcard tokens
  const tParts = targetSkel.split("/").filter(Boolean);
  let best: { score: number; fn: ImplFn } | null = null;

  for (const fn of implFns) {
    if (fn.method !== targetMethod) continue;
    for (const skel of fn.skeletons) {
      const sParts = skel.split("/").filter(Boolean);
      if (Math.abs(sParts.length - tParts.length) > 1) continue;
      let matches = 0;
      const minLen = Math.min(tParts.length, sParts.length);
      for (let i = 0; i < minLen; i++) {
        if (tParts[i] === "*" || sParts[i] === "*" || tParts[i] === sParts[i]) matches++;
      }
      const score = matches / Math.max(tParts.length, sParts.length);
      if (score >= 0.8 && (!best || score > best.score)) {
        best = { score, fn };
      }
    }
  }
  if (best) {
    return {
      impl: `${best.fn.name}? (${best.fn.file}) [fuzzy=${(best.score * 100).toFixed(0)}%]`,
      matchType: "fuzzy",
    };
  }

  return null;
}

// ─── HTTP ──────────────────────────────────────────────────────────────────

async function httpGet(url: string, opts: RequestInit = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    const body = await r.text().catch(() => "");
    return { status: r.status, body };
  } catch (e: unknown) {
    if ((e as Error).name === "AbortError") throw new Error("TIMEOUT");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function authenticate(): Promise<string> {
  if (TOKEN_ARG) return TOKEN_ARG;
  const r = await httpGet(`${BASEROW_API}/api/user/token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (r.status !== 200) throw new Error(`Auth ${r.status}: ${r.body.slice(0, 200)}`);
  const d = JSON.parse(r.body) as { token?: string; access_token?: string };
  const tok = d.token ?? d.access_token;
  if (!tok) throw new Error("No token in response");
  return tok;
}

// ─── URL builder ────────────────────────────────────────────────────────────

const DEFAULTS: Record<string, string> = {
  workspace_id: "1", table_id: "1", field_id: "1", row_id: "1",
  view_id: "1", filter_id: "1", sort_id: "1", decoration_id: "1",
  grouping_id: "1", application_id: "1", page_id: "1", element_id: "1",
  data_source_id: "1", workflow_action_id: "1", domain_id: "1",
  integration_id: "1", user_source_id: "1", snapshot_id: "1",
  webhook_id: "1", job_id: "1", notification_id: "1", invitation_id: "1",
  widget_id: "1", user_id: "1", team_id: "1", id: "1", scan_id: "1",
  result_id: "1", role_id: "1", template_id: "1", node_id: "1",
  slug: "test", token: "test-token", name: "test", filename: "test.txt",
  database_id: "1", chat_id: "1", message_id: "1", comment_id: "1",
};

function buildUrl(base: string, specPath: string, params: Parameter[]): string {
  return (base + specPath).replace(/\{(\w+)\}/g, (_, name) => {
    const p = params.find((x) => x.name === name);
    const ex = p?.schema?.example ?? p?.example ?? p?.schema?.default;
    if (ex !== undefined) return String(ex);
    return DEFAULTS[name] ?? DEFAULTS[name.replace(/_id$/, "")] ?? "1";
  });
}

function needsAuth(op: Operation): boolean {
  if (Array.isArray(op.security) && op.security.length === 0) return false;
  return true;
}

// ─── Section runner ─────────────────────────────────────────────────────────

async function runSection(
  tag: string,
  endpoints: Array<{ method: string; path: string; op: Operation }>,
  token: string,
  implFns: ImplFn[]
): Promise<EndpointResult[]> {
  return Promise.all(
    endpoints.map(async ({ method, path: specPath, op }) => {
      const params = (op.parameters ?? []) as Parameter[];
      const requiresAuth = needsAuth(op);
      const authH = requiresAuth ? { Authorization: `JWT ${token}` } : {};
      const match = findImpl(method, specPath, implFns);

      let appStatus: number | "SKIP" | "ERROR" = "SKIP";
      let apiStatus: number | "SKIP" | "ERROR" = "SKIP";
      let error: string | undefined;

      if (!NO_HTTP) {
        try {
          const [apiRes, appRes] = await Promise.all([
            httpGet(buildUrl(BASEROW_API, specPath, params), {
              method: method.toUpperCase(),
              headers: { "Content-Type": "application/json", ...authH },
            }),
            httpGet(buildUrl(APP_BASE, specPath, params), {
              method: method.toUpperCase(),
              headers: { "Content-Type": "application/json", ...authH },
            }),
          ]);
          apiStatus = apiRes.status;
          appStatus = appRes.status;
        } catch (e: unknown) {
          error = (e as Error).message;
          appStatus = "ERROR";
          apiStatus = "ERROR";
        }
      }

      return {
        tag,
        method: method.toUpperCase(),
        path: specPath,
        summary: op.summary ?? "",
        operationId: op.operationId ?? "",
        requiresAuth,
        appStatus,
        apiStatus,
        appResponds:
          typeof appStatus === "number" &&
          appStatus !== 404 &&
          appStatus !== 502 &&
          appStatus !== 503,
        apiAccepts: typeof apiStatus === "number" && apiStatus < 500,
        error,
        implementedIn: match?.impl,
        matchType: match?.matchType,
      } satisfies EndpointResult;
    })
  );
}

// ─── Report ─────────────────────────────────────────────────────────────────

function bar(pct: number) {
  const n = Math.round(pct / 10);
  return "█".repeat(n) + "░".repeat(10 - n);
}

function emo(s: number | "SKIP" | "ERROR"): string {
  if (s === "SKIP") return "⏭️ SKIP";
  if (s === "ERROR") return "💥 ERR";
  if (s >= 200 && s < 300) return `✅ ${s}`;
  if (s === 401 || s === 403) return `🔒 ${s}`;
  if (s === 404) return `❌ ${s}`;
  if (s === 405) return `🚫 ${s}`;
  if (s >= 400 && s < 500) return `⚠️ ${s}`;
  return `💥 ${s}`;
}

function generateReport(all: EndpointResult[], byTag: Map<string, EndpointResult[]>): string {
  const total = all.length;
  const solid = all.filter((r) => r.matchType === "exact").length;
  const fuzzy = all.filter((r) => r.matchType === "fuzzy").length;
  const none = total - solid - fuzzy;
  const pct = Math.round(solid / total * 100);
  const appOK = all.filter((r) => r.appResponds).length;

  const lines = [
    "# Baserow API Coverage Audit",
    "",
    `> Generated: ${new Date().toISOString()}`,
    `> App: \`${APP_BASE}\` | Baserow Cloud: \`${BASEROW_API}\``,
    NO_HTTP ? "> ⚠️ HTTP calls skipped (--no-http flag)" : "",
    "",
    "---",
    "",
    "## Summary",
    "",
    `\`${bar(pct)}\` **${pct}% solid coverage** (${solid} exact + ${fuzzy} fuzzy matches out of ${total} endpoints)`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total endpoints in spec | ${total} |`,
    `| Solid match (exact skeleton + method) | ${solid} |`,
    `| Fuzzy match (partial / method mismatch) | ${fuzzy} |`,
    `| Not implemented | ${none} |`,
    `| App responds (non-404/502) | ${appOK} / ${total} |`,
    "",
    "---",
    "",
    "## 🔴 Unimplemented Endpoints",
    "",
    "> No matching function found in `baserow.ts` or `admin.ts`.",
    "",
  ];

  // Gap list by tag
  const gaps = all.filter((r) => !r.implementedIn);
  const gapMap = new Map<string, EndpointResult[]>();
  for (const g of gaps) {
    if (!gapMap.has(g.tag)) gapMap.set(g.tag, []);
    gapMap.get(g.tag)!.push(g);
  }
  for (const [tag, gs] of gapMap) {
    lines.push(`### ${tag} (${gs.length} missing)`);
    for (const g of gs) {
      lines.push(`- \`${g.method}\` \`${g.path}\``);
      lines.push(`  ${g.summary || "(no description)"}`);
    }
    lines.push("");
  }

  lines.push("---", "", "## Per-Section Detail", "");

  for (const [tag, results] of byTag) {
    const s = results.filter((r) => r.matchType === "exact").length;
    const f = results.filter((r) => r.matchType === "fuzzy").length;
    const n = results.length;
    const p = Math.round(s / n * 100);

    lines.push(`### ${tag}`);
    lines.push(
      `\`${bar(p)}\` ${p}% — **${s}** exact · **${f}** fuzzy · **${n - s - f}** missing of ${n}`
    );
    lines.push("");
    lines.push("| | Method | Path | Summary | App | API | Function |");
    lines.push("|--|--------|------|---------|-----|-----|----------|");

    for (const r of results) {
      const mark = r.matchType === "exact" ? "🟢" : r.matchType === "fuzzy" ? "🟡" : "🔴";
      const fn = r.implementedIn
        ? `\`${r.implementedIn.replace(/\s*\[.*?\]/, "")}\``
        : "—";
      const appS = NO_HTTP ? "⏭️" : emo(r.appStatus);
      const apiS = NO_HTTP ? "⏭️" : emo(r.apiStatus);
      const sum = (r.summary || "").replace(/\|/g, "∣").slice(0, 50);
      lines.push(`| ${mark} | \`${r.method}\` | \`${r.path}\` | ${sum} | ${appS} | ${apiS} | ${fn} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║        Baserow API Coverage Audit  v3                 ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  // Load spec
  console.log("📄 Loading spec …");
  const spec: OpenAPISpec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
  const allPaths = Object.entries(spec.paths ?? {});
  console.log(`   ${allPaths.length} paths`);

  // Group by tag
  const byTag = new Map<string, Array<{ method: string; path: string; op: Operation }>>();
  for (const [p, methods] of allPaths) {
    for (const [method, op] of Object.entries(methods)) {
      if (method === "parameters") continue;
      for (const tag of (op as Operation).tags ?? ["untagged"]) {
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag)!.push({ method, path: p, op: op as Operation });
      }
    }
  }
  console.log(`   ${byTag.size} sections\n`);

  // Scan lib
  console.log("📦 Scanning lib files …");
  const implFns = scanLibFiles();
  console.log(`   ${implFns.length} functions found with API URLs`);
  console.log(`   ${implFns.reduce((a, f) => a + f.skeletons.length, 0)} URL skeletons extracted\n`);

  // Filter sections
  const sections = SECTION_FILTER
    ? [...byTag.entries()].filter(([t]) => t.toLowerCase().includes(SECTION_FILTER!.toLowerCase()))
    : [...byTag.entries()];

  if (sections.length === 0) {
    console.error(`❌ No sections match "${SECTION_FILTER}". Available:\n  ${[...byTag.keys()].join("\n  ")}`);
    process.exit(1);
  }

  // Auth
  let token = "";
  if (!NO_HTTP) {
    console.log("🔐 Authenticating …");
    try {
      token = await authenticate();
      console.log("   ✓ Got JWT\n");
    } catch (e) {
      console.warn("   ⚠️  Failed:", (e as Error).message, "— continuing without token\n");
    }
  }

  // Run sections
  const allResults: EndpointResult[] = [];
  const resultsByTag = new Map<string, EndpointResult[]>();

  for (let i = 0; i < sections.length; i++) {
    const [tag, endpoints] = sections[i];
    process.stdout.write(`[${i + 1}/${sections.length}] ${tag} (${endpoints.length}) … `);
    const results = await runSection(tag, endpoints, token, implFns);
    allResults.push(...results);
    resultsByTag.set(tag, results);

    const solid = results.filter((r) => r.matchType === "exact").length;
    const fuzzy = results.filter((r) => r.matchType === "fuzzy").length;
    const appOK = results.filter((r) => r.appResponds).length;
    process.stdout.write(
      `solid:${solid} fuzzy:${fuzzy} missing:${results.length - solid - fuzzy}` +
      (NO_HTTP ? "\n" : ` app:${appOK}/${results.length}\n`)
    );

    for (const r of results) {
      const m = r.matchType === "exact" ? "🟢" : r.matchType === "fuzzy" ? "🟡" : "🔴";
      const a = NO_HTTP ? " " : r.appResponds ? "✓" : "✗";
      const fn = r.implementedIn?.split(" ")[0] ?? "(none)";
      console.log(`   ${m}${a} ${r.method.padEnd(7)} ${r.path.slice(0, 60).padEnd(60)} ${fn}`);
    }
  }

  // Write outputs
  console.log("\n📊 Writing report …");
  const report = generateReport(allResults, resultsByTag);
  const reportPath = path.join(ROOT, "api-audit-report.md");
  const rawPath = path.join(ROOT, "api-audit-raw.json");
  fs.writeFileSync(reportPath, report, "utf8");
  fs.writeFileSync(rawPath, JSON.stringify(allResults, null, 2), "utf8");
  console.log(`   ✅ ${reportPath}`);
  console.log(`   ✅ ${rawPath}`);

  // Summary
  const total = allResults.length;
  const solid = allResults.filter((r) => r.matchType === "exact").length;
  const fuzzy = allResults.filter((r) => r.matchType === "fuzzy").length;
  const pct = Math.round(solid / total * 100);
  console.log(`
┌──────────────────────────────────────────────┐
│ Total endpoints    : ${String(total).padEnd(24)} │
│ Solid (exact)      : ${String(solid).padEnd(24)} │
│ Fuzzy              : ${String(fuzzy).padEnd(24)} │
│ Not implemented    : ${String(total - solid - fuzzy).padEnd(24)} │
│ Solid coverage     : ${String(pct + "%").padEnd(24)} │
└──────────────────────────────────────────────┘`);
}

main().catch((e) => {
  console.error("\n💥 Fatal:", e);
  process.exit(1);
});
