import { describe, expect, it } from "vitest";
import { imageProblem } from "./section-image";

const file = (type: string) => new File(["x"], "a", { type });

describe("imageProblem", () => {
  it("wants a description before anything is sent", () => {
    expect(imageProblem("  ")).toBe("Önce görselin açıklamasını yazın.");
    expect(imageProblem("Yaz koleksiyonu")).toBeNull();
  });

  it("limits the description to the length the server accepts", () => {
    expect(imageProblem("a".repeat(256))).toContain("255");
    expect(imageProblem("a".repeat(255))).toBeNull();
  });

  it("takes JPEG, PNG, WebP and GIF only", () => {
    expect(imageProblem("x", file("image/webp"))).toBeNull();
    expect(imageProblem("x", file("image/gif"))).toBeNull();
    expect(imageProblem("x", file("application/pdf"))).toBe(
      "Görsel JPEG, PNG, WebP veya GIF olmalı.",
    );
  });
});
