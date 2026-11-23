/** What the Campaign page screens allow, mirroring the backend's approval rule (phase 4,
 * section 2). UX only: the API enforces every one of them. */

export type PageStatus = "draft" | "pending_approval" | "published" | "unpublished";

const STATUS: Record<PageStatus, string> = {
  draft: "Taslak",
  pending_approval: "Onay bekliyor",
  published: "Yayında",
  unpublished: "Yayından kaldırıldı",
};

export const PAGE_STATUSES = Object.keys(STATUS) as [PageStatus, ...PageStatus[]];
export const pageStatusLabel = (s: string) => STATUS[s as PageStatus] ?? s;

export function pageStatusTone(s: string): "neutral" | "good" | "warn" {
  if (s === "published") return "good";
  if (s === "pending_approval") return "warn";
  return "neutral";
}

export type Viewer = { owner: boolean; submitter: boolean };
export type PageState = { status: PageStatus; hasPendingChange: boolean };

export type PageAction = "submit" | "withdraw" | "approve" | "reject" | "publish" | "unpublish";

export type ActionSpec = {
  action: PageAction;
  label: string;
  success: string;
  primary?: boolean;
};

const SPECS: Record<PageAction, Omit<ActionSpec, "action">> = {
  submit: { label: "Onaya gönder", success: "Sayfa onaya gönderildi.", primary: true },
  withdraw: { label: "Geri çek", success: "Sayfa geri çekildi." },
  approve: { label: "Onayla", success: "Onaylandı.", primary: true },
  reject: { label: "Reddet", success: "Reddedildi." },
  publish: { label: "Yayınla", success: "Sayfa yayınlandı.", primary: true },
  unpublish: { label: "Yayından kaldır", success: "Sayfa yayından kaldırıldı." },
};

const spec = (action: PageAction): ActionSpec => ({ action, ...SPECS[action] });

/** The status moves on offer. Staff submit and withdraw (their own); the Owner publishes,
 * unpublishes, approves and rejects. A published page with a pending change cannot be
 * unpublished until the Owner has approved or rejected the change. */
export function availableActions({ status, hasPendingChange }: PageState, who: Viewer) {
  const out: PageAction[] = [];
  if (status === "draft") out.push(who.owner ? "publish" : "submit");
  if (status === "pending_approval") {
    if (who.owner) out.push("approve", "reject");
    if (who.submitter) out.push("withdraw");
  }
  if (status === "published") {
    if (who.owner && hasPendingChange) out.push("approve", "reject");
    else if (who.owner) out.push("unpublish");
  }
  if (status === "unpublished" && who.owner) out.push("publish");
  return out.map(spec);
}

/** Where a save of the fields goes: straight to the page, to its pending change (Staff
 * editing a published page), or nowhere. */
export type EditTarget = "page" | "pending-change" | "none";

export function editTarget({ status, hasPendingChange }: PageState, who: Viewer): EditTarget {
  if (who.owner) return status === "published" && hasPendingChange ? "none" : "page";
  if (status === "draft") return "page";
  if (status === "published") return "pending-change";
  return "none";
}

/** Why the fields cannot be saved, or what a save does. */
export function editNote(state: PageState, who: Viewer): string | null {
  const target = editTarget(state, who);
  if (who.owner) {
    return target === "none"
      ? "Bekleyen bir değişiklik var; sayfayı düzenlemeden önce onaylayın veya reddedin."
      : null;
  }
  if (target === "pending-change")
    return "Yayındaki sayfada yaptığınız değişiklik sahibin onayına gider; onaylanana kadar yayında olan sürüm görünür.";
  if (state.status === "pending_approval")
    return "Onay bekleyen sayfa düzenlenemez; önce geri çekin.";
  if (state.status === "unpublished")
    return "Yayından kaldırılan sayfayı yalnızca sahip düzenleyebilir.";
  return null;
}

/** The cover image is not part of a pending change: the Owner changes it any time, Staff
 * only on a draft. */
export const imageEditable = ({ status }: PageState, who: Viewer) =>
  who.owner || status === "draft";

export function imageNote(state: PageState, who: Viewer): string | null {
  if (imageEditable(state, who)) return null;
  if (state.status === "pending_approval")
    return "Onay bekleyen sayfanın görseli değiştirilemez; önce geri çekin.";
  return "Kapak görselini yalnızca sahip değiştirebilir; yayındaki sayfalarda görsel bekleyen değişikliğin parçası değildir.";
}

/** The page's own fields, as a draft in the form holds them. */
export type PageFields = {
  title: string;
  slug: string;
  description: string;
  starts_at: string | null;
  ends_at: string | null;
};

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 20_000;

/** ISO moment -> the value of a `datetime-local` input, in the browser's time zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The value of a `datetime-local` input -> ISO moment, or null when empty. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** The rules the API applies, so the form can say so before saving. */
export function checkFields(
  f: Pick<PageFields, "title" | "description"> & { starts: string; ends: string },
): Partial<Record<"title" | "description" | "ends", string>> {
  const errors: Partial<Record<"title" | "description" | "ends", string>> = {};
  if (!f.title.trim()) errors.title = "Başlık gerekli.";
  else if (f.title.length > TITLE_MAX)
    errors.title = `Başlık en fazla ${TITLE_MAX} karakter olabilir.`;
  if (f.description.length > DESCRIPTION_MAX)
    errors.description = `Metin en fazla ${DESCRIPTION_MAX} karakter olabilir.`;
  const start = fromLocalInput(f.starts);
  const end = fromLocalInput(f.ends);
  if (start && end && new Date(end) <= new Date(start))
    errors.ends = "Bitiş tarihi başlangıçtan sonra olmalı.";
  return errors;
}

/** The fields a pending change differs on, for the Owner to read. */
export const FIELD_LABELS: Record<keyof PageFields, string> = {
  title: "Başlık",
  slug: "Adres",
  description: "Metin",
  starts_at: "Başlangıç",
  ends_at: "Bitiş",
};

export function changedFields(live: PageFields, change: Partial<PageFields>) {
  return (Object.keys(FIELD_LABELS) as (keyof PageFields)[])
    .filter((k) => k in change && (change[k] ?? null) !== (live[k] ?? null))
    .map((k) => ({ field: k, label: FIELD_LABELS[k], before: live[k], after: change[k] ?? null }));
}

/** What the Owner has to decide on a page. */
export type PendingKind = "submission" | "change";

export function pendingKind({ status, hasPendingChange }: PageState): PendingKind | null {
  if (status === "pending_approval") return "submission";
  if (status === "published" && hasPendingChange) return "change";
  return null;
}
