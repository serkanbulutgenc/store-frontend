import { describe, expect, it } from "vitest";
import { originFrom } from "./site-origin";

describe("originFrom", () => {
  it("prefers the forwarded proto and host", () => {
    const r = new Request("http://web:3000/x", {
      headers: { "x-forwarded-proto": "https", "x-forwarded-host": "aura.example" },
    });
    expect(originFrom(r)).toBe("https://aura.example");
  });
  it("falls back to the request URL", () => {
    expect(originFrom(new Request("http://localhost:3000/x"))).toBe("http://localhost:3000");
  });
});
