import { describe, expect, it } from "vitest";
import { pickerValue } from "./colour-input";

describe("pickerValue", () => {
  it("follows a valid typed code, lowercased for the native picker", () => {
    expect(pickerValue("#6B2D5C", "#000000")).toBe("#6b2d5c");
  });
  it("keeps the last valid colour while the typed code is incomplete or wrong", () => {
    expect(pickerValue("#", "#6b2d5c")).toBe("#6b2d5c");
    expect(pickerValue("#6b2d5", "#6b2d5c")).toBe("#6b2d5c");
    expect(pickerValue("#6b2d5g", "#6b2d5c")).toBe("#6b2d5c");
    expect(pickerValue("#abc", "#6b2d5c")).toBe("#6b2d5c");
  });
});
