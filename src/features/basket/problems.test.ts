import { describe, expect, it } from "vitest";
import { problemText } from "./problems";

describe("problemText", () => {
  it("is null for a fine line", () => {
    expect(problemText({ problem: null, available: 5 })).toBeNull();
  });
  it("names the remaining stock", () => {
    expect(problemText({ problem: "insufficient_stock", available: 2 })).toContain("2 adet");
  });
  it("covers sold out, unavailable and unknown problems", () => {
    expect(problemText({ problem: "sold_out", available: 0 })).toContain("tükendi");
    expect(problemText({ problem: "unavailable", available: 0 })).toContain("satışta değil");
    expect(problemText({ problem: "weird", available: 0 })).toBeTruthy();
  });
});
