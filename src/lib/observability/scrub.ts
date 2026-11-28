import type { ErrorEvent } from "@sentry/node";

/** Same rules as the backend (store_backend/observability.py): deny by default. */
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE = /(?<!\w)\+?\d[\d\s().-]{8,}\d(?!\w)/g;
const DROPPED_REQUEST_KEYS = ["data", "cookies", "headers", "query_string", "env"] as const;
const REDACTED = "[redacted]";
const QUERY_KEYS = ["url.query", "url.fragment", "http.query", "http.fragment"] as const;

/** Search text travels in URLs too. */
const withoutQuery = (url: string) => url.replace(/[?#].*$/s, "");

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
    if (event.request.url) event.request.url = withoutQuery(event.request.url);
  }
  for (const { data } of event.breadcrumbs ?? []) {
    if (!data) continue;
    for (const key of QUERY_KEYS) delete data[key];
    if (typeof data.url === "string") data.url = withoutQuery(data.url);
  }
  return scrub(event) as ErrorEvent;
}
