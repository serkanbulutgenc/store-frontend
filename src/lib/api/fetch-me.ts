import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getEnv } from "@/env";
import { adminApi } from "./clients";
import { ApiError } from "./errors";
import type { Me } from "./me";

/**
 * The signed-in staff member, or null. Skips the upstream call when there is no session
 * cookie, so anonymous storefront pages cost nothing. 401/403 mean "not staff": null.
 */
export const fetchMe = createServerFn({ method: "GET" }).handler(async (): Promise<Me | null> => {
  const cookies = getRequest().headers.get("cookie") ?? "";
  if (!new RegExp(`(?:^|;\\s*)${getEnv().SESSION_COOKIE_NAME}=`).test(cookies)) return null;
  try {
    const { data } = await adminApi.GET("/api/admin/me");
    return (data as Me | undefined) ?? null;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
});
