import { arrayMove } from "@dnd-kit/sortable";
import type { components } from "../../../../api/specs/openapi-admin";

/** Pure edits of the Homepage layout: the ordered sections the Owner arranges before saving. */

export type Section = components["schemas"]["HomepageLayoutOut"]["sections"][number];
export type SectionType = Section["type"];
export type Display = Section["display"];

export const MAX_SECTIONS = 20;

export const TYPE_LABELS: Record<SectionType, string> = {
  slider: "Slayt",
  products: "Ürünler",
  categories: "Kategoriler",
  banner: "Afiş",
  rich_text: "Yazı",
};

/** What the Owner can add today. Rich text waits for its own editor. */
export const ADDABLE: SectionType[] = ["slider", "products", "categories", "banner"];

export const DISPLAY_LABELS: Record<Display, string> = {
  carousel: "Kaydırmalı",
  grid: "Izgara",
  list: "Liste",
};

/** The display styles a section type offers. Only Products has a choice for now. */
export function displaysFor(type: SectionType): Display[] {
  return type === "products" ? ["carousel", "grid", "list"] : [];
}

/** Move a section one place up (-1) or down (1); at either end it stays put. */
export function moveSection(list: Section[], id: string, by: -1 | 1): Section[] {
  const from = list.findIndex((s) => s.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= list.length) return list;
  return arrayMove(list, from, to);
}

/** Drop one section where another sits, as a drag does. Unknown ids leave the list alone. */
export function dropSection(list: Section[], id: string, onto: string): Section[] {
  const from = list.findIndex((s) => s.id === id);
  const to = list.findIndex((s) => s.id === onto);
  if (from < 0 || to < 0 || from === to) return list;
  return arrayMove(list, from, to);
}

export const removeSection = (list: Section[], id: string): Section[] =>
  list.filter((s) => s.id !== id);

/** The settings every section has; type-specific settings are edited elsewhere. */
export type CommonPatch = Partial<Pick<Section, "title" | "link" | "visible" | "display">>;

export function updateSection(list: Section[], id: string, patch: CommonPatch): Section[] {
  return list.map((s) => (s.id === id ? ({ ...s, ...patch } as Section) : s));
}

const uniqueId = (list: Section[], type: SectionType) => {
  const taken = new Set(list.map((s) => s.id));
  let n = 1;
  while (taken.has(`${type}-${n}`)) n += 1;
  return `${type}-${n}`;
};

const NEW: Record<SectionType, (id: string) => Section> = {
  slider: (id) => ({
    id,
    type: "slider",
    title: "",
    link: "",
    visible: true,
    display: "carousel",
    settings: { source: "home", count: 5 },
  }),
  products: (id) => ({
    id,
    type: "products",
    title: "Yeni gelenler",
    link: "/ara?sort=newest",
    visible: true,
    display: "carousel",
    settings: { source: "latest", count: 12 },
  }),
  categories: (id) => ({
    id,
    type: "categories",
    title: "Kategoriler",
    link: "",
    visible: true,
    display: "carousel",
    settings: { source: "home", count: 12 },
  }),
  banner: (id) => ({
    id,
    type: "banner",
    title: "",
    link: "",
    visible: true,
    display: "carousel",
    settings: { slot: "home_mid", index: 0 },
  }),
  rich_text: (id) => ({
    id,
    type: "rich_text",
    title: "",
    link: "",
    visible: true,
    display: "carousel",
    settings: { body: "" },
  }),
};

/** Add a new section of `type` at the end, with its defaults. A full layout is left alone. */
export function addSection(list: Section[], type: SectionType): Section[] {
  if (list.length >= MAX_SECTIONS) return list;
  return [...list, NEW[type](uniqueId(list, type))];
}

export const isDirty = (saved: Section[], draft: Section[]) =>
  JSON.stringify(saved) !== JSON.stringify(draft);
