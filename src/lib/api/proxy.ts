/**
 * Framework-free core of the `/api/**` proxy. Takes a standard `Request`, returns a
 * standard `Response`, so the route handler and SSR loaders share it and tests need no
 * server.
 *
 * Django is private. The browser never sees the allauth session token: it lives in an
 * HttpOnly cookie that this module turns into `X-Session-Token` on the way in, and
 * captures from allauth login responses on the way out.
 */

export type ProxyConfig = {
  /** Internal Django origin, e.g. http://api:8000 */
  apiUrl: string;
  sessionCookie: string;
  /** Django's CSRF cookie name (`__Secure-csrftoken` in production). */
  csrfCookie: string;
};

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

const SESSION_MAX_AGE = 14 * 24 * 60 * 60;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DROP_RESPONSE_HEADERS = [
  "content-length",
  "content-encoding",
  "transfer-encoding",
  "connection",
  "set-cookie",
];

/** `/api/auth/*` is allauth headless (app mode); the other prefixes keep their path. */
function upstreamPath(pathname: string): string | null {
  // Readiness (Postgres and Redis) for the external uptime check; no other root path is public.
  if (pathname === "/api/health") return "/health";
  if (pathname.startsWith("/api/auth/"))
    return `/_allauth/app/v1/${pathname.slice("/api/auth/".length)}`;
  if (pathname.startsWith("/api/store/") || pathname.startsWith("/api/admin/")) return pathname;
  return null;
}

export function parseCookies(header: string | null): Map<string, string> {
  const jar = new Map<string, string>();
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) jar.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return jar;
}

export function sessionCookie(config: ProxyConfig, value: string, secure: boolean): string {
  return `${config.sessionCookie}=${value}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function clearedSessionCookie(config: ProxyConfig, secure: boolean): string {
  return `${config.sessionCookie}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function isSecure(url: URL, request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return (forwarded || url.protocol.replace(":", "")) === "https";
}

/**
 * The proxy echoes the HttpOnly CSRF cookie as `X-CSRFToken`, so Django's token check can
 * no longer tell a cross-site request apart. This is the check that replaces it: an unsafe
 * request must come from our own origin.
 */
function isSameSite(request: Request, url: URL): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser callers and same-origin GET-less fetches
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * A first-time guest has no CSRF cookie, and the proxy can only echo one that exists. Ask
 * Django for one (its `GET /api/store/csrf` sets the cookie) so the guest's first write,
 * typically adding to the basket, is not rejected. Returns null if Django does not issue one.
 */
async function issueCsrf(
  config: ProxyConfig,
  doFetch: Fetch,
  secure: boolean,
  host: string,
): Promise<{ value: string; setCookie: string } | null> {
  try {
    const res = await doFetch(`${config.apiUrl}/api/store/csrf`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-forwarded-proto": secure ? "https" : "http",
        "x-forwarded-host": host,
      },
      redirect: "manual",
    });
    for (const setCookie of res.headers.getSetCookie()) {
      const pair = setCookie.split(";")[0] ?? "";
      const i = pair.indexOf("=");
      if (i > 0 && pair.slice(0, i).trim() === config.csrfCookie)
        return { value: pair.slice(i + 1).trim(), setCookie };
    }
  } catch {
    // Fall through: the write goes out without a token and Django answers 403.
  }
  return null;
}

export async function forward(
  request: Request,
  config: ProxyConfig,
  doFetch: Fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const path = upstreamPath(url.pathname);
  if (path === null)
    return Response.json(
      { code: "not_found", message: "Kayıt bulunamadı.", fields: {} },
      { status: 404 },
    );

  const unsafe = !SAFE_METHODS.has(request.method);
  if (unsafe && !isSameSite(request, url)) {
    return Response.json(
      { code: "forbidden", message: "Bu işlem için yetkiniz yok.", fields: {} },
      { status: 403 },
    );
  }

  const secure = isSecure(url, request);
  const jar = parseCookies(request.headers.get("cookie"));
  const token = jar.get(config.sessionCookie);

  const headers = new Headers();
  for (const name of ["accept", "accept-language", "content-type", "user-agent"]) {
    const v = request.headers.get(name);
    if (v) headers.set(name, v);
  }
  // Everything except the session cookie reaches Django: Oscar's basket cookie and CSRF cookie.
  const rest = [...jar].filter(([k]) => k !== config.sessionCookie).map(([k, v]) => `${k}=${v}`);
  if (rest.length) headers.set("cookie", rest.join("; "));
  if (token) headers.set("x-session-token", token);
  const origin = request.headers.get("origin");
  if (origin) headers.set("origin", origin);
  headers.set("x-forwarded-proto", secure ? "https" : "http");
  headers.set("x-forwarded-host", url.host);
  // The CSRF cookie is HttpOnly, so the browser cannot echo it; do it here.
  let csrf = jar.get(config.csrfCookie);
  let issuedCsrfCookie: string | undefined;
  if (unsafe && !csrf && !token && path.startsWith("/api/store/")) {
    const issued = await issueCsrf(config, doFetch, secure, url.host);
    if (issued) {
      csrf = issued.value;
      issuedCsrfCookie = issued.setCookie;
      headers.set("cookie", [...rest, `${config.csrfCookie}=${issued.value}`].join("; "));
    }
  }
  if (csrf && unsafe) headers.set("x-csrftoken", csrf);

  const hasBody = unsafe;
  const upstream = await doFetch(`${config.apiUrl}${path}${url.search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const out = new Headers();
  upstream.headers.forEach((v, k) => {
    if (!DROP_RESPONSE_HEADERS.includes(k)) out.set(k, v);
  });
  const location = out.get("location");
  if (location?.startsWith(config.apiUrl)) {
    out.set("location", `${url.origin}${location.slice(config.apiUrl.length)}`);
  }
  for (const c of upstream.headers.getSetCookie()) out.append("set-cookie", c);
  if (issuedCsrfCookie) out.append("set-cookie", issuedCsrfCookie);

  let body: BodyInit | null = upstream.body;
  const isJson = upstream.headers.get("content-type")?.includes("application/json");
  let newToken: string | undefined;
  // allauth answers "confirm your password again" (reauthentication) with a 401 for a user who
  // is still signed in; clearing the cookie then would log them out mid-task.
  let stillSignedIn = false;
  if (isJson && path.startsWith("/_allauth/")) {
    const data = (await upstream.json()) as {
      meta?: { session_token?: string; is_authenticated?: boolean };
    } | null;
    newToken = data?.meta?.session_token;
    stillSignedIn = data?.meta?.is_authenticated === true;
    if (data?.meta && "session_token" in data.meta) delete data.meta.session_token;
    body = JSON.stringify(data);
  }

  if (newToken) out.append("set-cookie", sessionCookie(config, newToken, secure));
  else if (upstream.status === 401 && !stillSignedIn)
    out.append("set-cookie", clearedSessionCookie(config, secure));

  return new Response(upstream.status === 204 || upstream.status === 304 ? null : body, {
    status: upstream.status,
    headers: out,
  });
}
