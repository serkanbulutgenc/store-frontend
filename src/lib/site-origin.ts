import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getEnv } from "@/env";

/** Public origin from the request the reverse proxy forwarded, e.g. `https://shop.example`. */
export function originFrom(req: Request): string {
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.slice(0, -1);
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    url.host;
  return `${proto}://${host}`;
}

/** Configured `SITE_URL` wins, so a spoofed Host header cannot steer canonical URLs. */
export const fetchSiteOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const configured = getEnv().SITE_URL;
  return configured ? new URL(configured).origin : originFrom(getRequest());
});
