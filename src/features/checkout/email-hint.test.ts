import { describe, expect, it } from "vitest";
import { suggestEmail } from "./email-hint";

describe("suggestEmail", () => {
  it("fixes one-character typos of common providers", () => {
    expect(suggestEmail("ayse@gmial.com")).toBe("ayse@gmail.com");
    expect(suggestEmail("ayse@hotmial.com")).toBe("ayse@hotmail.com");
    expect(suggestEmail("ayse@gmail.con")).toBe("ayse@gmail.com");
  });
  it("stays quiet for correct or unrelated domains", () => {
    expect(suggestEmail("ayse@gmail.com")).toBeNull();
    expect(suggestEmail("ayse@firma.com.tr")).toBeNull();
    expect(suggestEmail("ayse")).toBeNull();
    expect(suggestEmail("")).toBeNull();
  });
});
