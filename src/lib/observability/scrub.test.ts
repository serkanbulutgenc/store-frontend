import type { ErrorEvent } from "@sentry/node";
import { expect, it } from "vitest";
import { beforeSend, scrubText } from "./scrub";

it("replaces emails and phone numbers in text", () => {
  expect(scrubText("mail ayse@example.com or +90 532 123 45 67 now")).toBe(
    "mail [redacted] or [redacted] now",
  );
  expect(scrubText("call 0532-123-45-67")).toBe("call [redacted]");
});

it("leaves ordinary text and short numbers alone", () => {
  expect(scrubText("Order 1042 failed at step 3")).toBe("Order 1042 failed at step 3");
});

it("drops request body, cookies, headers, query string and user, and scrubs the rest", () => {
  const event = {
    type: undefined,
    user: { email: "a@b.co", ip_address: "1.2.3.4" },
    server_name: "host",
    request: {
      url: "https://x.test/p",
      data: { phone: "05321234567" },
      cookies: { s: "1" },
      headers: { cookie: "s=1" },
      query_string: "email=a@b.co",
    },
    message: "failed for ayse@example.com",
    exception: { values: [{ type: "Error", value: "bad +905321234567" }] },
  } as unknown as ErrorEvent;
  const out = beforeSend(event) as unknown as Record<string, unknown> & {
    exception: { values: { value: string }[] };
  };
  expect(out.user).toBeUndefined();
  expect(out.server_name).toBeUndefined();
  expect(out.request).toEqual({ url: "https://x.test/p" });
  expect(out.message).toBe("failed for [redacted]");
  expect(out.exception.values[0]?.value).toBe("bad [redacted]");
  expect(JSON.stringify(out)).not.toMatch(/@|532/);
});
