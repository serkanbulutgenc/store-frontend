import { describe, expect, it } from "vitest";
import { classGuideSchema, guideSource, toClassGuideBody } from "./size-guide-form";

describe("classGuideSchema", () => {
  it("accepts a guide up to the Description limit and refuses a longer one", () => {
    expect(classGuideSchema.safeParse({ text: "x".repeat(5000) }).success).toBe(true);

    const r = classGuideSchema.safeParse({ text: "x".repeat(5001) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["text"]);
  });

  it("counts characters, not UTF-16 units", () => {
    expect(classGuideSchema.safeParse({ text: "😀".repeat(5000) }).success).toBe(true);
  });

  it("accepts an empty guide, which means the class has none", () => {
    expect(classGuideSchema.safeParse({ text: "" }).success).toBe(true);
  });
});

describe("toClassGuideBody", () => {
  it("sends the text as written, line breaks kept", () => {
    expect(toClassGuideBody({ text: "| A |\n|---|\n| 1 |\n" })).toEqual({
      text: "| A |\n|---|\n| 1 |\n",
    });
  });
});

describe("guideSource", () => {
  it("says a Product uses its class guide unless it has an override", () => {
    expect(guideSource("")).toBe("class");
    expect(guideSource("  \n")).toBe("class");
    expect(guideSource("| M | 70 |")).toBe("override");
  });
});
