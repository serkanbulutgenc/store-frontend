import type { MenuItemBody } from "./tree";

export type TargetType = MenuItemBody["target_type"];

/** What the item dialog holds while the Owner fills it in. */
export type ItemDraft = {
  target_type: TargetType;
  label: string;
  url: string;
  /** Whether a target has been picked (for every type that needs one). */
  has_target: boolean;
  include_subcategories: boolean;
};

export const LABEL_MAX = 200;
export const URL_MAX = 500;

/** Types whose target is picked from a list rather than typed or left out. */
const PICKED: TargetType[] = [
  "category",
  "legal_page",
  "product",
  "brand",
  "collection",
  "campaign_page",
  "builtin",
];

/** No whitespace, control characters or backslashes anywhere in the address. */
const PLAIN = (s: string) =>
  [...s].every((c) => {
    const code = c.codePointAt(0) ?? 0;
    return !/\s/.test(c) && code > 0x1f && code !== 0x7f && c !== "\\";
  });

/** An internal path: one leading slash, not `//host` or `/\`. */
const isInternal = (s: string) => s.startsWith("/") && !/^\/[/\\]/.test(s) && PLAIN(s);

/** `https://host[:port][/path]`: a real host, no credentials. */
const isExternal = (s: string) =>
  /^https:\/\/[A-Za-z0-9][A-Za-z0-9.-]*(?::\d{1,5})?(?:[/?#].*)?$/.test(s) && PLAIN(s);

/** The rules the API applies to one item, so the dialog can say so before saving. */
export function checkItem(draft: ItemDraft): Partial<Record<"label" | "url" | "target", string>> {
  const errors: Partial<Record<"label" | "url" | "target", string>> = {};
  if (draft.label.length > LABEL_MAX) errors.label = `Ad en fazla ${LABEL_MAX} karakter olabilir.`;
  if (draft.target_type === "group" && !draft.label.trim()) {
    errors.label = "Grup başlığının adı gerekli.";
  }
  if (PICKED.includes(draft.target_type) && !draft.has_target) errors.target = "Bir hedef seçin.";
  if (draft.target_type === "url") {
    const url = draft.url.trim();
    if (url.length > URL_MAX) errors.url = `Bağlantı en fazla ${URL_MAX} karakter olabilir.`;
    else if (!(isInternal(url) || isExternal(url))) {
      errors.url = "Bağlantı '/' ile başlayan bir iç yol ya da 'https://' adresi olmalı.";
    }
  }
  return errors;
}

export const TARGET_TYPES: { value: TargetType; label: string }[] = [
  { value: "category", label: "Kategori" },
  { value: "legal_page", label: "Yasal sayfa" },
  { value: "product", label: "Ürün" },
  { value: "brand", label: "Marka" },
  { value: "collection", label: "Koleksiyon" },
  { value: "campaign_page", label: "Kampanya sayfası" },
  { value: "builtin", label: "Hazır sayfa" },
  { value: "url", label: "Özel bağlantı" },
  { value: "group", label: "Grup başlığı" },
];

export const typeLabel = (t: TargetType) => TARGET_TYPES.find((x) => x.value === t)?.label ?? t;

/** The Storefront's own pages, by the key the API knows them under. */
export const BUILTIN_PAGES: { value: string; label: string }[] = [
  { value: "home", label: "Ana sayfa" },
  { value: "order_tracking", label: "Sipariş takibi" },
  { value: "favorites", label: "Favorilerim" },
  { value: "basket", label: "Sepet" },
  { value: "legal_search", label: "Yasal sayfalarda ara" },
  { value: "campaigns", label: "Kampanyalar" },
  { value: "contact", label: "İletişim" },
];
