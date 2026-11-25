import { describe, expect, it } from "vitest";
import {
  ADDABLE,
  addSection,
  clampCount,
  displaysFor,
  dropSection,
  isDirty,
  MAX_SECTIONS,
  moveSection,
  pickMissing,
  removeSection,
  type Section,
  updateSection,
  updateSettings,
  warningFor,
} from "./layout";

const base = (id: string) => ({ ...addSection([], "banner")[0], id }) as Section;
const list = (...ids: string[]) => ids.map(base);
const ids = (sections: Section[]) => sections.map((s) => s.id);

describe("moveSection", () => {
  it("moves a section one place up or down", () => {
    expect(ids(moveSection(list("a", "b", "c"), "b", -1))).toEqual(["b", "a", "c"]);
    expect(ids(moveSection(list("a", "b", "c"), "b", 1))).toEqual(["a", "c", "b"]);
  });

  it("leaves the list alone at either end or for an unknown id", () => {
    const l = list("a", "b");
    expect(moveSection(l, "a", -1)).toBe(l);
    expect(moveSection(l, "b", 1)).toBe(l);
    expect(moveSection(l, "zzz", 1)).toBe(l);
  });
});

describe("dropSection", () => {
  it("drops a section where another sits", () => {
    expect(ids(dropSection(list("a", "b", "c"), "a", "c"))).toEqual(["b", "c", "a"]);
    expect(ids(dropSection(list("a", "b", "c"), "c", "a"))).toEqual(["c", "a", "b"]);
  });

  it("does nothing for itself or unknown ids", () => {
    const l = list("a", "b");
    expect(dropSection(l, "a", "a")).toBe(l);
    expect(dropSection(l, "a", "zzz")).toBe(l);
  });
});

describe("removeSection and updateSection", () => {
  it("removes by id", () => {
    expect(ids(removeSection(list("a", "b"), "a"))).toEqual(["b"]);
  });

  it("changes the common settings of one section and keeps its other settings", () => {
    const l = addSection([], "products");
    const [first] = updateSection(l, "products-1", { visible: false, title: "Seçki" });
    expect(first).toMatchObject({ visible: false, title: "Seçki" });
    expect(first?.settings).toEqual({ source: "latest", count: 12, window: 30 });
  });

  it("leaves other sections as they were", () => {
    const l = list("a", "b");
    expect(updateSection(l, "a", { visible: false })[1]).toBe(l[1]);
  });
});

describe("addSection", () => {
  it("adds a section with its defaults at the end and a fresh id", () => {
    const once = addSection([], "products");
    const twice = addSection(once, "products");
    expect(ids(twice)).toEqual(["products-1", "products-2"]);
    expect(twice[1]?.settings).toEqual({ source: "latest", count: 12, window: 30 });
  });

  it("reuses a gap in the ids instead of colliding", () => {
    const l = addSection(addSection([], "slider"), "slider");
    expect(ids(addSection(removeSection(l, "slider-1"), "slider"))).toEqual([
      "slider-2",
      "slider-1",
    ]);
  });

  it("stops at the section limit", () => {
    let l: Section[] = [];
    for (let n = 0; n < MAX_SECTIONS + 2; n += 1) l = addSection(l, "banner");
    expect(l).toHaveLength(MAX_SECTIONS);
  });

  it("offers every type, Rich text included", () => {
    expect(ADDABLE).toContain("rich_text");
    expect(ADDABLE).toHaveLength(5);
  });
});

describe("displaysFor", () => {
  it("lets only Products choose a display style", () => {
    expect(displaysFor("products")).toEqual(["carousel", "grid", "list"]);
    expect(displaysFor("banner")).toEqual([]);
  });
});

describe("isDirty", () => {
  it("is false for the same layout and true after any change", () => {
    const saved = list("a", "b");
    expect(isDirty(saved, [...saved])).toBe(false);
    expect(isDirty(saved, updateSection(saved, "a", { visible: false }))).toBe(true);
    expect(isDirty(saved, moveSection(saved, "a", 1))).toBe(true);
  });
});

describe("pickMissing for own slides", () => {
  const slider = (banner_ids: number[]): Section => ({
    id: "s",
    type: "slider",
    title: "",
    link: "",
    visible: true,
    display: "carousel",
    settings: { source: "own", count: 5, banner_ids },
  });

  it("asks for at least one uploaded slide", () => {
    expect(pickMissing(slider([]))).toBe("En az bir slayt yükleyin.");
    expect(pickMissing(slider([4]))).toBeNull();
  });
});

describe("warningFor", () => {
  const saved = list("a", "b");
  const warnings = { a: "Boş." };

  it("gives the reason for an unchanged section that has one", () => {
    expect(warningFor(saved, saved[0] as Section, warnings)).toBe("Boş.");
    expect(warningFor(saved, saved[1] as Section, warnings)).toBeNull();
  });

  it("stays quiet once the section was edited, or is not saved yet", () => {
    const edited = updateSection(saved, "a", { title: "Yeni" })[0] as Section;
    expect(warningFor(saved, edited, warnings)).toBeNull();
    expect(warningFor(saved, { ...(saved[0] as Section), id: "new" }, { new: "x" })).toBeNull();
  });
});

describe("clampCount", () => {
  it("keeps a count between 4 and 24", () => {
    expect(clampCount(1)).toBe(4);
    expect(clampCount(10)).toBe(10);
    expect(clampCount(99)).toBe(24);
    expect(clampCount(Number.NaN)).toBe(4);
  });
});

describe("updateSettings", () => {
  it("changes only the settings of the named Products or Categories section", () => {
    const l = addSection(addSection([], "products"), "categories");
    const next = updateSettings(l, "products-1", { source: "best_selling", window: 7 });
    expect(next[0]).toMatchObject({ settings: { source: "best_selling", window: 7, count: 12 } });
    expect(next[1]).toBe(l[1]);
  });

  it("leaves other sections alone, and edits a rich text body", () => {
    const l = addSection(addSection([], "banner"), "rich_text");
    const next = updateSettings(l, "rich_text-1", { body: "Merhaba" });
    expect(next[0]).toBe(l[0]);
    expect(next[1]).toMatchObject({ settings: { body: "Merhaba" } });
  });
});

describe("pickMissing", () => {
  const products = (settings: object) =>
    ({ ...addSection([], "products")[0], settings }) as Section;

  it("asks for the pick a source needs", () => {
    expect(pickMissing(products({ source: "category", count: 12, window: 30 }))).toMatch(
      /kategori/,
    );
    expect(
      pickMissing(products({ source: "hand_picked", count: 12, window: 30, product_ids: [] })),
    ).toMatch(/ürün/);
    expect(
      pickMissing({
        ...addSection([], "categories")[0],
        settings: { source: "picked", count: 12, category_ids: [] },
      } as Section),
    ).toMatch(/kategori/);
  });

  it("is satisfied once something is picked or the source needs none", () => {
    expect(
      pickMissing(products({ source: "category", count: 12, window: 30, category_id: 3 })),
    ).toBeNull();
    expect(pickMissing(products({ source: "latest", count: 12, window: 30 }))).toBeNull();
  });
});

describe("slider and banner settings", () => {
  const slider = (settings: object) => ({ ...addSection([], "slider")[0], settings }) as Section;

  it("asks for the banners or collection a slider source needs", () => {
    expect(pickMissing(slider({ source: "banners", count: 5, banner_ids: [] }))).toMatch(/afiş/);
    expect(pickMissing(slider({ source: "collection", count: 5 }))).toMatch(/koleksiyon/);
    expect(pickMissing(slider({ source: "banners", count: 5, banner_ids: [3] }))).toBeNull();
    expect(pickMissing(slider({ source: "home", count: 5 }))).toBeNull();
  });

  it("edits a slider's and a banner's own settings", () => {
    const l = addSection(addSection([], "slider"), "banner");
    expect(
      updateSettings(l, "slider-1", { source: "collection", collection_id: 2 })[0],
    ).toMatchObject({
      settings: { source: "collection", collection_id: 2, count: 5 },
    });
    expect(updateSettings(l, "banner-1", { banner_id: 9 })[1]).toMatchObject({
      settings: { banner_id: 9, index: 0 },
    });
  });
});
