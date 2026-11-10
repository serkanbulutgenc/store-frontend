import * as Sentry from "@sentry/node";
import { definePlugin } from "nitro";
import { beforeSend } from "../../src/lib/observability/scrub";

/** Error tracking for the Start server. Does nothing unless SENTRY_DSN is set. */
export default definePlugin((nitroApp) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || "production",
      release: process.env.SENTRY_RELEASE || undefined,
      includeLocalVariables: false,
      tracesSampleRate: 0,
      beforeSend,
    });
  } catch (e) {
    // A bad DSN must not stop the shop from starting.
    console.error("Sentry is disabled: invalid configuration", e);
    return;
  }
  nitroApp.hooks.hook("error", (error) => {
    Sentry.captureException(error);
  });
});
