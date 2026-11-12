import { describe, expect, it } from "vitest";
import { desiError, findProvince, rateDirty, rateErrors, toRatePatch } from "./rules";

const saved = { band_0_2: "45.00", band_3_5: "55.00", band_6_10: "70.00", per_extra_desi: "5.00" };

describe("rateErrors", () => {
  it("accepts the saved row", () => {
    expect(rateErrors(saved)).toEqual({});
  });
  it("rejects zero, negative, comma and blank prices", () => {
    for (const bad of ["0", "0.00", "-5", "10,5", "", "abc", "1.234"]) {
      expect(rateErrors({ ...saved, band_0_2: bad }).band_0_2).toBeTruthy();
    }
  });
  it("requires prices to rise with the desi band", () => {
    expect(rateErrors({ ...saved, band_0_2: "60" }).band_0_2).toMatch(/artmalı/);
    expect(rateErrors({ ...saved, band_6_10: "50" }).band_6_10).toMatch(/artmalı/);
  });
  it("lets equal neighbouring bands through", () => {
    expect(rateErrors({ ...saved, band_3_5: "45" })).toEqual({});
  });
  it("does not constrain the per-desi price against the bands", () => {
    expect(rateErrors({ ...saved, per_extra_desi: "500" })).toEqual({});
  });
});

describe("rateDirty and toRatePatch", () => {
  it("is clean when the numbers are the same however they are written", () => {
    expect(rateDirty(saved, { ...saved, band_0_2: "45" })).toBe(false);
  });
  it("sends only the changed prices", () => {
    expect(toRatePatch(saved, { ...saved, band_3_5: "58.5" })).toEqual({ band_3_5: "58.5" });
  });
});

describe("desiError", () => {
  it("accepts whole numbers from 1 to 1000", () => {
    for (const ok of ["1", "4", "1000"]) expect(desiError(ok)).toBeNull();
  });
  it("rejects zero, decimals, blanks and too big", () => {
    for (const bad of ["0", "1.5", "", "-1", "1001", "a"]) expect(desiError(bad)).toBeTruthy();
  });
  it("lets a product leave desi blank when asked", () => {
    expect(desiError("", { optional: true })).toBeNull();
  });
});

describe("findProvince", () => {
  const provinces = [{ name: "İstanbul" }, { name: "Isparta" }, { name: "İzmir" }];
  it("matches exactly, ignoring case and spaces", () => {
    expect(findProvince(provinces, "  istanbul ")).toBe(provinces[0]);
  });
  it("treats the dotted and dotless i alike", () => {
    expect(findProvince(provinces, "izmir")).toBe(provinces[2]);
    expect(findProvince(provinces, "İZMİR")).toBe(provinces[2]);
    expect(findProvince(provinces, "ısparta")).toBe(provinces[1]);
    expect(findProvince(provinces, "isparta")).toBe(provinces[1]);
  });
  it("does not match a prefix or blank text", () => {
    expect(findProvince(provinces, "Is")).toBeUndefined();
    expect(findProvince(provinces, "  ")).toBeUndefined();
  });
});
