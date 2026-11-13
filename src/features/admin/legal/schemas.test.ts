import { describe, expect, it } from "vitest";
import { isUnchanged, legalFormSchema } from "./schemas";

describe("legal form", () => {
  it("needs a title and a text", () => {
    expect(legalFormSchema.safeParse({ title: " ", body: "x" }).success).toBe(false);
    expect(legalFormSchema.safeParse({ title: "t", body: "" }).success).toBe(false);
    expect(legalFormSchema.safeParse({ title: "t", body: "x" }).success).toBe(true);
  });
  it("sees surrounding whitespace as no change, like the API", () => {
    const saved = { title: "Başlık", body: "Metin\n" };
    expect(isUnchanged({ title: " Başlık ", body: "Metin" }, saved)).toBe(true);
    expect(isUnchanged({ title: "Başlık", body: "Metin 2" }, saved)).toBe(false);
  });
});
