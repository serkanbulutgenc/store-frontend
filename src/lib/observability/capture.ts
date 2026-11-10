import { createServerOnlyFn } from "@tanstack/react-start";
import { ApiError } from "@/lib/api/errors";

/** Expected API outcomes (validation, 401, 403, 404) are not bugs; everything else is. */
export function shouldReport(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500;
  return true;
}

const send = createServerOnlyFn(async (error: unknown) => {
  const Sentry = await import("@sentry/node");
  Sentry.captureException(error);
});

/**
 * Route errors are caught by TanStack Router and rendered by an error component, so
 * Nitro's own `error` hook never sees them. Call this from the component on the server.
 * A no-op in the browser, and in the server when Sentry was never initialised.
 */
export function reportServerError(error: unknown): void {
  if (typeof window !== "undefined" || !shouldReport(error)) return;
  void send(error).catch(() => {});
}
