import { describe, expect, it } from "vitest";
import { LOGO_MAX_BYTES, validateLogo } from "./brand-logo";

describe("validateLogo", () => {
  it("accepts PNG, JPEG and WebP up to 2 MB", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"])
      expect(validateLogo({ type, size: LOGO_MAX_BYTES })).toBeNull();
  });
  it("refuses SVG, GIF and HEIC", () => {
    for (const type of ["image/svg+xml", "image/gif", "image/heic", ""])
      expect(validateLogo({ type, size: 1000 })).toMatch(/PNG, JPEG veya WebP/);
  });
  it("refuses a file over 2 MB", () => {
    expect(validateLogo({ type: "image/png", size: LOGO_MAX_BYTES + 1 })).toMatch(/2 MB/);
  });
});
