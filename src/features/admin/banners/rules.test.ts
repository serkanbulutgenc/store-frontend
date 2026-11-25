import { describe, expect, it } from "vitest";
import {
  availableActions,
  type BannerState,
  canDelete,
  changedFields,
  checkFields,
  completeness,
  editNote,
  imageEditable,
  isImageSlot,
  slotLabel,
  warnings,
} from "./rules";

const staff = { owner: false, submitter: false };
const owner = { owner: true, submitter: false };
const s = (status: BannerState["status"], hasPendingChange = false): BannerState => ({
  status,
  hasPendingChange,
});

const valid = {
  slot: "category_top",
  message: "",
  link: "",
  position: "0",
  starts: "",
  ends: "",
};

describe("availableActions", () => {
  it("lets Staff submit a draft and the Owner publish it, with Banner wording", () => {
    expect(availableActions(s("draft"), staff).map((a) => a.action)).toEqual(["submit"]);
    const publish = availableActions(s("draft"), owner)[0];
    expect(publish?.action).toBe("publish");
    expect(publish?.success).toBe("Banner yayınlandı.");
  });
});

describe("slots", () => {
  it("treats every slot but the announcement bar as image-led", () => {
    expect(isImageSlot("announcement")).toBe(false);
    expect(isImageSlot("category_top")).toBe(true);
    expect(isImageSlot("category_top")).toBe(true);
    expect(slotLabel("announcement")).toBe("Duyuru çubuğu");
  });
});

describe("checkFields", () => {
  it("accepts an image Banner with no message", () => {
    expect(checkFields(valid)).toEqual({});
  });

  it("requires a message for the announcement bar, within 200 characters", () => {
    expect(checkFields({ ...valid, slot: "announcement" }).message).toBe(
      "Duyuru için bir mesaj yazın.",
    );
    expect(
      checkFields({ ...valid, slot: "announcement", message: "x".repeat(201) }).message,
    ).toMatch(/en fazla 200/);
    expect(checkFields({ ...valid, slot: "announcement", message: "Kargo bedava" })).toEqual({});
  });

  it("takes a site path or an https address as the link, and nothing else", () => {
    expect(checkFields({ ...valid, link: "/kampanyalar/yaz" })).toEqual({});
    expect(checkFields({ ...valid, link: "https://example.com" })).toEqual({});
    expect(checkFields({ ...valid, link: "http://example.com" }).link).toBeDefined();
    expect(checkFields({ ...valid, link: "//example.com" }).link).toBeDefined();
    expect(checkFields({ ...valid, link: "javascript:alert(1)" }).link).toBeDefined();
  });

  it("keeps the order a whole number from 0 to 10000", () => {
    expect(checkFields({ ...valid, position: "" }).position).toBeDefined();
    expect(checkFields({ ...valid, position: "-1" }).position).toBeDefined();
    expect(checkFields({ ...valid, position: "1.5" }).position).toBeDefined();
    expect(checkFields({ ...valid, position: "10001" }).position).toBeDefined();
    expect(checkFields({ ...valid, position: "10000" })).toEqual({});
  });

  it("rejects an end that is not after the start", () => {
    const bad = checkFields({ ...valid, starts: "2026-07-02T10:00", ends: "2026-07-01T10:00" });
    expect(bad.ends).toBe("Bitiş tarihi başlangıçtan sonra olmalı.");
    expect(
      checkFields({ ...valid, starts: "2026-07-01T10:00", ends: "2026-07-01T10:00" }).ends,
    ).toBeDefined();
    expect(checkFields({ ...valid, starts: "2026-07-01T10:00", ends: "2026-07-02T10:00" })).toEqual(
      {},
    );
    expect(checkFields({ ...valid, ends: "2026-07-02T10:00" })).toEqual({});
  });
});

describe("completeness", () => {
  it("flags a missing image on image slots, but not a missing alt text", () => {
    expect(completeness({ slot: "category_top", message: "", image: null })).toEqual([
      "Görsel yüklenmemiş.",
    ]);
    expect(completeness({ slot: "category_top", message: "", image: { alt_text: " " } })).toEqual(
      [],
    );
    expect(completeness({ slot: "category_top", message: "", image: { alt_text: "Yaz" } })).toEqual(
      [],
    );
  });

  it("needs only a message on the announcement bar", () => {
    expect(completeness({ slot: "announcement", message: "", image: null })).toHaveLength(1);
    expect(completeness({ slot: "announcement", message: "Merhaba", image: null })).toEqual([]);
  });
});

describe("warnings and deleting", () => {
  it("warns, without blocking, about a missing alt text", () => {
    expect(warnings({ slot: "category_top", image: { alt_text: " " } })).toHaveLength(1);
    expect(warnings({ slot: "category_top", image: { alt_text: "Yaz" } })).toEqual([]);
    expect(warnings({ slot: "category_top", image: null })).toEqual([]);
  });

  it("lets the Owner delete any Banner and Staff only a draft", () => {
    expect(canDelete(s("published"), owner)).toBe(true);
    expect(canDelete(s("draft"), staff)).toBe(true);
    expect(canDelete(s("pending_approval"), staff)).toBe(false);
    expect(canDelete(s("published"), staff)).toBe(false);
  });
});

describe("edit rules", () => {
  it("lets Staff change images of a draft only, the Owner any time", () => {
    expect(imageEditable(s("draft"), staff)).toBe(true);
    expect(imageEditable(s("published"), staff)).toBe(false);
    expect(imageEditable(s("published"), owner)).toBe(true);
  });

  it("explains a Staff edit of a live Banner", () => {
    expect(editNote(s("published"), staff)).toMatch(/onayına gider/);
    expect(editNote(s("draft"), staff)).toBeNull();
  });
});

describe("changedFields", () => {
  it("lists only what differs", () => {
    const live = {
      slot: "category_top",
      message: "",
      link: "/a",
      position: 0,
      starts_at: null,
      ends_at: null,
      category_id: null,
    };
    expect(changedFields(live, { link: "/b", position: 0 }).map((c) => c.field)).toEqual(["link"]);
  });
});
