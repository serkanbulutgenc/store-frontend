import { describe, expect, it } from "vitest";
import {
  badgeText,
  changedFields,
  fieldLabel,
  formatValue,
  itemKey,
  kindBadge,
  REASON_MAX,
  reasonError,
  showsRejection,
} from "./rules";

describe("kindBadge", () => {
  it("calls a first draft new and a Staff edit of a live item a change", () => {
    expect(kindBadge({ is_change: false })).toEqual({ label: "Yeni", tone: "good" });
    expect(kindBadge({ is_change: true })).toEqual({ label: "Değişiklik", tone: "warn" });
  });
});

describe("badgeText", () => {
  it("shows nothing when nothing waits or the count is not known yet", () => {
    expect(badgeText(0)).toBeUndefined();
    expect(badgeText(undefined)).toBeUndefined();
  });
  it("shows the count, capped at 99+", () => {
    expect(badgeText(3)).toBe("3");
    expect(badgeText(99)).toBe("99");
    expect(badgeText(100)).toBe("99+");
  });
});

describe("reasonError", () => {
  it("accepts a reason up to the limit, counting after trimming", () => {
    expect(reasonError("")).toBeNull();
    expect(reasonError(`  ${"a".repeat(REASON_MAX)}  `)).toBeNull();
  });
  it("refuses a longer one", () => {
    expect(reasonError("a".repeat(REASON_MAX + 1))).toMatch(/en fazla 500/);
  });
});

describe("formatValue", () => {
  it("shows a dash for nothing", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue(undefined)).toBe("—");
    expect(formatValue("")).toBe("—");
    expect(formatValue([])).toBe("—");
  });
  it("shows text, numbers and yes/no as they read", () => {
    expect(formatValue("Yaz")).toBe("Yaz");
    expect(formatValue(3)).toBe("3");
    expect(formatValue(true)).toBe("Evet");
    expect(formatValue(false)).toBe("Hayır");
  });
  it("lists an array's items", () => {
    expect(formatValue([4, 7, 9])).toBe("4, 7, 9");
  });
});

describe("fieldLabel", () => {
  it("names the known fields and leaves an unknown one as the API names it", () => {
    expect(fieldLabel("name")).toBe("Ad");
    expect(fieldLabel("product_ids")).toBe("Ürünler");
    expect(fieldLabel("cover_alt")).toBe("cover_alt");
  });
});

describe("changedFields", () => {
  it("keeps only the fields that differ", () => {
    const fields = [
      { field: "title", live: "A", pending: "A", changed: false },
      { field: "body", live: "x", pending: "y", changed: true },
    ];
    expect(changedFields(fields).map((f) => f.field)).toEqual(["body"]);
  });
});

describe("itemKey", () => {
  it("is unique across kinds that share an id", () => {
    expect(itemKey({ type: "collection", id: 1 })).not.toBe(itemKey({ type: "banner", id: 1 }));
  });
});

describe("showsRejection", () => {
  const item = { rejection_reason: "Eksik", status: "draft", pending_change: null };
  it("shows the reason on a sent-back draft and on a live item whose edit was rejected", () => {
    expect(showsRejection(item)).toBe(true);
    expect(showsRejection({ ...item, status: "published" })).toBe(true);
  });
  it("shows nothing without a reason, or while something waits", () => {
    expect(showsRejection({ ...item, rejection_reason: "" })).toBe(false);
    expect(showsRejection({ ...item, status: "pending_approval" })).toBe(false);
    expect(showsRejection({ ...item, status: "published", pending_change: {} })).toBe(false);
    expect(showsRejection({ ...item, status: "unpublished" })).toBe(false);
  });
});
