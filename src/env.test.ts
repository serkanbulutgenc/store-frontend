import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env";

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    const env = parseEnv({ API_INTERNAL_URL: "http://api:8000", SESSION_COOKIE_NAME: "s" });
    expect(env.SESSION_COOKIE_NAME).toBe("s");
  });

  it("rejects a missing or malformed value", () => {
    expect(() => parseEnv({ SESSION_COOKIE_NAME: "s" })).toThrow(/API_INTERNAL_URL/);
    expect(() => parseEnv({ API_INTERNAL_URL: "nope", SESSION_COOKIE_NAME: "s" })).toThrow(
      /Invalid environment/,
    );
    expect(() =>
      parseEnv({ API_INTERNAL_URL: "http://api:8000", SESSION_COOKIE_NAME: "" }),
    ).toThrow(/SESSION_COOKIE_NAME/);
  });
});
