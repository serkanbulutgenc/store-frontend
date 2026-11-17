/** What the Collection screens allow, mirroring the backend rules (store-backend ADR 0008).
 * UX only: the API enforces every one of them. */

export type CollectionStatus = "draft" | "pending_approval" | "published" | "unpublished";

const STATUS: Record<CollectionStatus, string> = {
  draft: "Taslak",
  pending_approval: "Onay bekliyor",
  published: "Yayında",
  unpublished: "Yayından kaldırıldı",
};

export const COLLECTION_STATUSES = Object.keys(STATUS) as [CollectionStatus, ...CollectionStatus[]];
export const collectionStatusLabel = (s: string) => STATUS[s as CollectionStatus] ?? s;

export function collectionStatusTone(s: string): "neutral" | "good" | "warn" {
  if (s === "published") return "good";
  if (s === "pending_approval") return "warn";
  return "neutral";
}

export type Viewer = { owner: boolean; submitter: boolean };
export type CollectionState = { status: CollectionStatus; hasPendingChange: boolean };

export type CollectionAction =
  | "submit"
  | "withdraw"
  | "approve"
  | "reject"
  | "publish"
  | "unpublish";

export type ActionSpec = {
  action: CollectionAction;
  label: string;
  success: string;
  /** The Owner's approve and reject apply to a pending change when the Collection has one. */
  primary?: boolean;
};

const SPECS: Record<CollectionAction, Omit<ActionSpec, "action">> = {
  submit: { label: "Onaya gönder", success: "Koleksiyon onaya gönderildi.", primary: true },
  withdraw: { label: "Geri çek", success: "Koleksiyon geri çekildi." },
  approve: { label: "Onayla", success: "Onaylandı.", primary: true },
  reject: { label: "Reddet", success: "Reddedildi." },
  publish: { label: "Yayınla", success: "Koleksiyon yayınlandı.", primary: true },
  unpublish: { label: "Yayından kaldır", success: "Koleksiyon yayından kaldırıldı." },
};

const spec = (action: CollectionAction): ActionSpec => ({ action, ...SPECS[action] });

/** The status moves on offer. Staff submit and withdraw (their own); the Owner publishes,
 * unpublishes, approves and rejects. A published Collection with a pending change cannot be
 * unpublished until the Owner has approved or rejected the change. */
export function availableActions({ status, hasPendingChange }: CollectionState, who: Viewer) {
  const out: CollectionAction[] = [];
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

/** Where a save of the fields goes: straight to the Collection, to its pending change
 * (the Owner amending it, or Staff editing a published Collection), or nowhere. */
export type EditTarget = "collection" | "pending-change" | "none";

export function editTarget({ status, hasPendingChange }: CollectionState, who: Viewer): EditTarget {
  if (who.owner) {
    if (status === "published" && hasPendingChange) return "pending-change";
    return "collection";
  }
  if (status === "draft") return "collection";
  if (status === "published") return "pending-change";
  return "none";
}

/** Why the fields cannot be saved, or what a save does. */
export function editNote({ status }: CollectionState, who: Viewer): string | null {
  const target = editTarget({ status, hasPendingChange: false }, who);
  if (who.owner) return null;
  if (target === "pending-change")
    return "Yayındaki koleksiyonda yaptığınız değişiklik sahibin onayına gider; onaylanana kadar yayında olan sürüm görünür.";
  if (status === "pending_approval")
    return "Onay bekleyen koleksiyon düzenlenemez; önce geri çekin.";
  if (status === "unpublished")
    return "Yayından kaldırılan koleksiyonu yalnızca sahip düzenleyebilir.";
  return null;
}

/** The cover image is not part of a pending change: the Owner changes it except while a
 * published Collection has one; Staff only on a draft. */
export function imageEditable({ status, hasPendingChange }: CollectionState, who: Viewer) {
  if (who.owner) return !(status === "published" && hasPendingChange);
  return status === "draft";
}

/** Why the image controls are off, for the line under them. */
export function imageNote({ status, hasPendingChange }: CollectionState, who: Viewer) {
  if (imageEditable({ status, hasPendingChange }, who)) return null;
  if (who.owner)
    return "Bekleyen değişiklik varken görsel değiştirilemez; önce onaylayın veya reddedin.";
  return "Kapak görselini yalnızca sahip değiştirebilir; yayındaki koleksiyonlarda görsel bekleyen değişikliğin parçası değildir.";
}

/** The list with the item at `from` moved by `delta` places (a no-op at either end). */
export function move<T>(items: readonly T[], from: number, delta: -1 | 1): T[] {
  const to = from + delta;
  if (to < 0 || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Whether the Storefront would show a Product: only a published one. */
export const isVisible = (product: { status: string }) => product.status === "published";

export const EMPTY_WARNING =
  "Bu koleksiyonda mağazada görünen ürün yok. Yayına alırsanız sayfası bulunamadı (404) verir ve menüden kalkar.";

/** A warning for whoever is about to publish or approve a version with no visible Product.
 * `products` is the version that would go live: the pending change's list when there is one. */
export function emptyWarning(
  moves: readonly { action: CollectionAction }[],
  products: readonly { status: string }[],
): string | null {
  const goesLive = moves.some((m) => m.action === "publish" || m.action === "approve");
  return goesLive && !products.some(isVisible) ? EMPTY_WARNING : null;
}

/** What the Owner has to decide on a Collection: a first submission, a change to a published
 * one, or nothing. */
export type PendingKind = "submission" | "change";

export function pendingKind({ status, hasPendingChange }: CollectionState): PendingKind | null {
  if (status === "pending_approval") return "submission";
  if (status === "published" && hasPendingChange) return "change";
  return null;
}

export const PENDING_KIND_LABEL: Record<PendingKind, string> = {
  submission: "Yeni gönderim",
  change: "Bekleyen değişiklik",
};
