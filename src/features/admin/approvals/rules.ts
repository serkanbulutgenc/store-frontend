/** What the approval queue shows and allows. UX only: the API decides (store-backend phase 4,
 * section 2). */
import type { components } from "../../../../api/specs/openapi-admin";

export type ApprovalItem = components["schemas"]["QueueItemOut"];
export type FieldDiff = components["schemas"]["FieldDiffOut"];

/** The reason the API accepts is at most this long. */
export const REASON_MAX = 500;

export const itemKey = (item: Pick<ApprovalItem, "type" | "id">) => `${item.type}:${item.id}`;

/** A new draft waits for its first publish; a change is a Staff edit of something already live. */
export function kindBadge(item: Pick<ApprovalItem, "is_change">): {
  label: string;
  tone: "good" | "warn";
} {
  return item.is_change ? { label: "Değişiklik", tone: "warn" } : { label: "Yeni", tone: "good" };
}

/** The nav badge text; capped so it never outgrows the sidebar. Nothing waiting shows nothing. */
export function badgeText(count: number | undefined): string | undefined {
  if (!count) return undefined;
  return count > 99 ? "99+" : String(count);
}

export function reasonError(reason: string): string | null {
  return reason.trim().length > REASON_MAX
    ? `Gerekçe en fazla ${REASON_MAX} karakter olabilir.`
    : null;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Ad",
  title: "Başlık",
  slug: "Adres",
  description: "Açıklama",
  body: "Metin",
  product_ids: "Ürünler",
  sections: "Bölümler",
};

/** A readable name for a field; one we do not know shows as the API names it. */
export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

type SectionLike = {
  id: string;
  type: string;
  title?: string;
  visible?: boolean;
  settings?: unknown;
};

const isSection = (v: unknown): v is SectionLike =>
  typeof v === "object" && v !== null && "id" in v && "type" in v;

/** A Homepage layout as one line per section, in order: "1. products · Yeni gelenler (gizli)". */
function sectionLines(sections: SectionLike[]): string {
  if (sections.length === 0) return "—";
  return sections
    .map(
      (s, i) =>
        `${i + 1}. ${s.type} · ${s.title || s.id}${s.visible === false ? " (gizli)" : ""}${s.settings ? ` ${JSON.stringify(s.settings)}` : ""}`,
    )
    .join("\n");
}

/** A field value as text for the side-by-side view. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (Array.isArray(value) && value.every(isSection)) return sectionLines(value);
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** The fields that differ, or all of them when nothing is marked (a first draft marks all). */
export const changedFields = (fields: FieldDiff[]): FieldDiff[] => fields.filter((f) => f.changed);

/** A rejection reason is for the submitter: on a draft sent back, or on a live item whose
 * edit was rejected. A waiting item or one with a new change pending has nothing to explain. */
export const showsRejection = (item: {
  rejection_reason: string;
  status: string;
  pending_change: unknown;
}) =>
  item.rejection_reason !== "" &&
  item.pending_change === null &&
  (item.status === "draft" || item.status === "published");
