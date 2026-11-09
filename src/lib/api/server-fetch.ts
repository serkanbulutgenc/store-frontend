import { appendResponseHeader, getRequest } from "@tanstack/react-start/server";
import { getEnv } from "@/env";
import { forward } from "./proxy";

/**
 * Fetch for SSR loaders and server functions: the same `forward` helper the `/api/**`
 * route uses, called in-process with the incoming request's cookies. Cookies Django sets
 * (guest basket, CSRF) or the session cookie are appended to the SSR response so the
 * browser gets them on the same hop.
 */
export async function serverFetch(req: Request): Promise<Response> {
  const incoming = getRequest();
  const url = new URL(req.url);
  const target = new URL(url.pathname + url.search, incoming.url);
  const headers = new Headers(req.headers);
  const cookie = incoming.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const forwardedProto = incoming.headers.get("x-forwarded-proto");
  if (forwardedProto) headers.set("x-forwarded-proto", forwardedProto);

  const env = getEnv();
  const res = await forward(
    new Request(target, {
      method: req.method,
      headers,
      body: req.body && (await req.arrayBuffer()),
    }),
    {
      apiUrl: env.API_INTERNAL_URL,
      sessionCookie: env.SESSION_COOKIE_NAME,
      csrfCookie: env.CSRF_COOKIE_NAME,
    },
  );
  for (const c of res.headers.getSetCookie()) appendResponseHeader("set-cookie", c);
  return res;
}
