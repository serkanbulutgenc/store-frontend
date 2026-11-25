import { arrayMove } from "@dnd-kit/sortable";
import type { components } from "../../../../api/specs/openapi-admin";

/** Pure edits of the Homepage layout: the ordered sections the Owner arranges before saving. */

export type Section = components["schemas"]["HomepageLayoutOut"]["sections"][number];
export type SectionType = Section["type"];
export type Display = Section["display"];

export const MAX_SECTIONS = 20;
export const MIN_ITEMS = 4;
export const MAX_ITEMS = 24;

export type ProductsSettings = Extract<Section, { type: "products" }>["settings"];
export type CategoriesSettings = Extract<Section, { type: "categories" }>["settings"];
export type RichTextSettings = Extract<Section, { type: "rich_text" }>["settings"];
export type SliderSettings = Extract<Section, { type: "slider" }>["settings"];
export type BannerSettings = Extract<Section, { type: "banner" }>["settings"];
export type SliderSource = SliderSettings["source"];
export type SettingsPatch =
  | Partial<ProductsSettings>
  | Partial<CategoriesSettings>
  | Partial<SliderSettings>
  | Partial<BannerSettings>
  | Partial<RichTextSettings>;
export type ProductSource = ProductsSettings["source"];
export type CategorySource = CategoriesSettings["source"];
export type Window = ProductsSettings["window"];

export const PRODUCT_SOURCE_LABELS: Record<ProductSource, string> = {
  latest: "Yeni gelenler",
  best_selling: "Çok satanlar",
  on_sale: "İndirimdekiler",
  category: "Bir kategori",
  hand_picked: "Elle seçilenler",
  recently_viewed: "Son baktıkları",
};

export const CATEGORY_SOURCE_LABELS: Record<CategorySource, string> = {
  home: "Kategori ayarında işaretlenenler",
  picked: "Elle seçilenler",
};

export const SLIDER_SOURCE_LABELS: Record<SliderSource, string> = {
  home: "Öne çıkan ürünler (ana sayfa koleksiyonu ya da yeni ürünler)",
  collection: "Bir koleksiyon",
  own: "Kendi görsellerim",
};

export const WINDOWS: Window[] = [7, 30, 90];

/** A count the shop accepts: a whole number from MIN_ITEMS to MAX_ITEMS; anything else is clamped. */
export function clampCount(n: number): number {
  if (!Number.isFinite(n)) return MIN_ITEMS;
  return Math.min(MAX_ITEMS, Math.max(MIN_ITEMS, Math.trunc(n)));
}

/** Edit one section's own settings. Other sections are left alone. */
export function updateSettings(list: Section[], id: string, patch: SettingsPatch): Section[] {
  return list.map((s) =>
    s.id === id ? ({ ...s, settings: { ...s.settings, ...patch } } as Section) : s,
  );
}

/** Whether a section's settings are complete enough to save: a source that needs a pick has one. */
export function pickMissing(s: Section): string | null {
  if (s.type === "slider") {
    if (s.settings.source === "own" && !(s.settings.banner_ids ?? []).length)
      return "En az bir slayt yükleyin.";
    if (s.settings.source === "collection" && s.settings.collection_id == null)
      return "Bir koleksiyon seçin.";
  }
  if (s.type === "products") {
    if (s.settings.source === "category" && s.settings.category_id == null)
      return "Bir kategori seçin.";
    if (s.settings.source === "hand_picked" && !(s.settings.product_ids ?? []).length)
      return "En az bir ürün seçin.";
  }
  if (s.type === "categories" && s.settings.source === "picked") {
    if (!(s.settings.category_ids ?? []).length) return "En az bir kategori seçin.";
  }
  return null;
}

export const TYPE_LABELS: Record<SectionType, string> = {
  slider: "Slayt",
  products: "Ürünler",
  categories: "Kategoriler",
  banner: "Afiş",
  rich_text: "Yazı",
};

/** What the Owner can add. */
export const ADDABLE: SectionType[] = ["slider", "products", "categories", "banner", "rich_text"];

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
    settings: { source: "latest", count: 12, window: 30 },
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
    settings: {},
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

/** Why the Storefront skips this section, or null. The reason was worked out for the saved
 * section, so it is shown only while the section in the editor is still that one. */
export function warningFor(
  saved: Section[],
  section: Section,
  warnings: Record<string, string>,
): string | null {
  const was = saved.find((s) => s.id === section.id);
  if (!was || JSON.stringify(was) !== JSON.stringify(section)) return null;
  return warnings[section.id] ?? null;
}
