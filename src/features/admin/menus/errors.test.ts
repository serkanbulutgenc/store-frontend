import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { menuErrors } from "./errors";

const refused = (fields: Record<string, string[]>, message = "Kaydedilemedi.") =>
  new ApiError(422, "menu_error", message, fields);

describe("menuErrors", () => {
  it("puts a rule about the whole Menu at the top", () => {
    const result = menuErrors(refused({ items: ["Üst menü boş kaydedilemez."] }));
    expect(result.top).toEqual(["Üst menü boş kaydedilemez."]);
    expect(result.items).toEqual([]);
  });

  it("puts an item's error on that item, by its place in the tree, naming the field", () => {
    const result = menuErrors(
      refused({
        "items[1].url": ["Bağlantı '/' ile başlayan bir iç yol ya da 'https://' adresi olmalı."],
        "items[0].children[2].label": ["Ad en fazla 200 karakter olabilir."],
      }),
    );
    expect(result.top).toEqual([]);
    expect(result.items).toEqual([
      {
        path: [1],
        field: "url",
        message: "Bağlantı '/' ile başlayan bir iç yol ya da 'https://' adresi olmalı.",
      },
      { path: [0, 2], field: "label", message: "Ad en fazla 200 karakter olabilir." },
    ]);
  });

  it("puts an error on an item as a whole (too deep, wrong target) with no field", () => {
    const result = menuErrors(
      refused({
        "items[0].children[0].children[0].children[0]": ["Bu menü en fazla 3 seviye olabilir."],
      }),
    );
    expect(result.items).toEqual([
      { path: [0, 0, 0, 0], field: null, message: "Bu menü en fazla 3 seviye olabilir." },
    ]);
  });

  it("keeps every message of a field, and shows a failure with no field names as the top message", () => {
    expect(menuErrors(refused({ items: ["a", "b"] })).top).toEqual(["a", "b"]);
    expect(menuErrors(new ApiError(403, "forbidden", "Bu işlem için yetkiniz yok.")).top).toEqual([
      "Bu işlem için yetkiniz yok.",
    ]);
    expect(menuErrors(new Error("boom")).top).toEqual(["Beklenmeyen bir hata oluştu."]);
  });

  it("does not repeat the generic message when field errors already say what is wrong", () => {
    expect(menuErrors(refused({ "items[0].label": ["x"] }, "Geçersiz istek.")).top).toEqual([]);
  });
});
