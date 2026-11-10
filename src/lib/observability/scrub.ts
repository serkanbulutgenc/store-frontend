import type { ErrorEvent } from "@sentry/node";

/** Same rules as the backend (store_backend/observability.py): deny by default. */
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE = /(?<!\w)\+?\d[\d\s().-]{8,}\d(?!\w)/g;
const DROPPED_REQUEST_KEYS = ["data", "cookies", "headers", "query_string", "env"] as const;
const REDACTED = "[redacted]";

export function scrubText(text: string): string {
  return text.replace(EMAIL, REDACTED).replace(PHONE, REDACTED);
}

function scrub(value: unknown): unknown {
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(v)]));
  }
  return value;
}

export function beforeSend(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.server_name;
  if (event.request) {
    for (const key of DROPPED_REQUEST_KEYS) delete event.request[key];
  }
  return scrub(event) as ErrorEvent;
}
