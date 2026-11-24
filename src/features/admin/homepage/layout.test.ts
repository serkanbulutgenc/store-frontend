import { describe, expect, it } from "vitest";
import {
  ADDABLE,
  addSection,
  displaysFor,
  dropSection,
  isDirty,
  MAX_SECTIONS,
  moveSection,
  removeSection,
  type Section,
  updateSection,
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
    expect(first?.settings).toEqual({ source: "latest", count: 12 });
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
    expect(twice[1]?.settings).toEqual({ source: "latest", count: 12 });
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

  it("offers every type but Rich text", () => {
    expect(ADDABLE).not.toContain("rich_text");
    expect(ADDABLE).toHaveLength(4);
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
