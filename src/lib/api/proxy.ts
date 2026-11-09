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
  if (pathname.startsWith("/api/auth/"))
    return `/_allauth/app/v1/${pathname.slice("/api/auth/".length)}`;
  if (pathname.startsWith("/api/store/") || pathname.startsWith("/api/admin/")) return pathname;
  return null;
}

function parseCookies(header: string | null): Map<string, string> {
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
  return (request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")) === "https";
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
  headers.set("origin", url.origin);
  headers.set("x-forwarded-proto", secure ? "https" : "http");
  headers.set("x-forwarded-host", url.host);
  // The CSRF cookie is HttpOnly, so the browser cannot echo it; do it here.
  const csrf = jar.get(config.csrfCookie);
  if (csrf && !SAFE_METHODS.has(request.method)) headers.set("x-csrftoken", csrf);

  const hasBody = !SAFE_METHODS.has(request.method);
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
  for (const c of upstream.headers.getSetCookie()) out.append("set-cookie", c);

  let body: BodyInit | null = upstream.body;
  const isJson = upstream.headers.get("content-type")?.includes("application/json");
  let newToken: string | undefined;
  if (isJson && path.startsWith("/_allauth/")) {
    const data = (await upstream.json()) as { meta?: { session_token?: string } } | null;
    newToken = data?.meta?.session_token;
    if (data?.meta && "session_token" in data.meta) delete data.meta.session_token;
    body = JSON.stringify(data);
  }

  if (newToken) out.append("set-cookie", sessionCookie(config, newToken, secure));
  else if (upstream.status === 401) out.append("set-cookie", clearedSessionCookie(config, secure));

  return new Response(upstream.status === 204 || upstream.status === 304 ? null : body, {
    status: upstream.status,
    headers: out,
  });
}
