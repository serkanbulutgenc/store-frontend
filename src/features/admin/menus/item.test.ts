import { describe, expect, it } from "vitest";
import { BUILTIN_PAGES, checkItem, type ItemDraft } from "./item";

const draft = (over: Partial<ItemDraft> = {}): ItemDraft => ({
  target_type: "url",
  label: "",
  url: "/kampanyalar",
  has_target: true,
  include_subcategories: false,
  ...over,
});

describe("checkItem", () => {
  it("accepts an internal path and an https address", () => {
    expect(checkItem(draft({ url: "/kampanyalar" }))).toEqual({});
    expect(checkItem(draft({ url: "https://example.com:8443/a?b=1#c" }))).toEqual({});
  });

  it("refuses a custom URL that is neither, naming the url field", () => {
    for (const url of [
      "",
      "kampanyalar",
      "http://example.com",
      "//evil.com",
      "/a b",
      "javascript:alert(1)",
      "https://",
    ]) {
      expect(Object.keys(checkItem(draft({ url }))), url).toEqual(["url"]);
    }
    expect(checkItem(draft({ url: "kampanyalar" })).url).toBe(
      "Bağlantı '/' ile başlayan bir iç yol ya da 'https://' adresi olmalı.",
    );
  });

  it("refuses a URL longer than 500 characters", () => {
    expect(checkItem(draft({ url: `/${"a".repeat(500)}` })).url).toBe(
      "Bağlantı en fazla 500 karakter olabilir.",
    );
  });

  it("needs a name for a group heading, since it has nothing to take one from", () => {
    expect(checkItem(draft({ target_type: "group", url: "", has_target: false })).label).toBe(
      "Grup başlığının adı gerekli.",
    );
    expect(
      checkItem(draft({ target_type: "group", url: "", has_target: false, label: "  " })).label,
    ).toBe("Grup başlığının adı gerekli.");
    expect(
      checkItem(draft({ target_type: "group", url: "", has_target: false, label: "Kurumsal" })),
    ).toEqual({});
  });

  it("lets other items go without a name, but not past 200 characters", () => {
    expect(checkItem(draft({ label: "" }))).toEqual({});
    expect(checkItem(draft({ label: "a".repeat(200) }))).toEqual({});
    expect(checkItem(draft({ label: "a".repeat(201) })).label).toBe(
      "Ad en fazla 200 karakter olabilir.",
    );
  });

  it("needs a target picked for a Category, Legal page, Product, Brand, Collection or built-in page", () => {
    for (const target_type of [
      "category",
      "legal_page",
      "product",
      "brand",
      "collection",
      "campaign_page",
      "builtin",
    ] as const) {
      expect(
        checkItem(draft({ target_type, url: "", has_target: false })).target,
        target_type,
      ).toBe("Bir hedef seçin.");
      expect(checkItem(draft({ target_type, url: "", has_target: true })), target_type).toEqual({});
    }
  });
});

describe("BUILTIN_PAGES", () => {
  it("offers the contact page and the all-Campaigns list", () => {
    const keys = BUILTIN_PAGES.map((p) => p.value);
    expect(keys).toContain("contact");
    expect(keys).toContain("campaigns");
  });
});
