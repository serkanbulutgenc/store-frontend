import { describe, expect, it } from "vitest";
import { moveItem, pickUploadable, validateFile } from "./rules";

const file = (type: string, size = 1000, name = "a") => ({ type, size, name }) as File;

describe("validateFile", () => {
  it("accepts jpeg, png, webp and heic", () => {
    for (const t of ["image/jpeg", "image/png", "image/webp", "image/heic"]) {
      expect(validateFile(file(t))).toBeNull();
    }
  });
  it("rejects other types and oversize files in Turkish", () => {
    expect(validateFile(file("application/pdf"))).toMatch(/JPEG/);
    expect(validateFile(file("image/jpeg", 15 * 1024 * 1024 + 1))).toMatch(/15 MB/);
  });
  it("accepts a heic file whose type is empty by its extension", () => {
    expect(validateFile(file("", 10, "IMG_1.HEIC"))).toBeNull();
  });
});

describe("pickUploadable", () => {
  it("keeps only valid files within the remaining room and reports the rest", () => {
    const files = [
      file("image/png", 1, "a"),
      file("text/plain", 1, "b"),
      file("image/png", 1, "c"),
    ];
    const r = pickUploadable(files, 1);
    expect(r.accepted.map((f) => f.name)).toEqual(["a"]);
    expect(r.rejected.map((x) => x.file.name)).toEqual(["b", "c"]);
    expect(r.rejected[1]?.reason).toMatch(/12/);
  });
});

describe("moveItem", () => {
  it("moves an element and leaves the input untouched", () => {
    const a = [1, 2, 3, 4];
    expect(moveItem(a, 3, 0)).toEqual([4, 1, 2, 3]);
    expect(moveItem(a, 0, 2)).toEqual([2, 3, 1, 4]);
    expect(a).toEqual([1, 2, 3, 4]);
  });
  it("ignores out-of-range moves", () => {
    expect(moveItem([1, 2], 0, 5)).toEqual([1, 2]);
  });
});
