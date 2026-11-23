/** What the Banner screens allow. The approval rule is the one Campaign pages use (phase 4,
 * section 2), so its logic is shared; the wording and the field checks are the Banner's.
 * UX only: the API enforces every rule. */
import {
  type ActionSpec,
  editTarget,
  fromLocalInput,
  imageEditable,
  type PageAction,
  type PageState,
  availableActions as pageActions,
  pageStatusLabel,
  pageStatusTone,
  pendingKind,
  toLocalInput,
  type Viewer,
} from "../campaign-pages/rules";

export { PAGE_STATUSES as STATUSES } from "../campaign-pages/rules";
export type { PageAction as BannerAction, PageState as BannerState, Viewer };
export {
  editTarget,
  fromLocalInput,
  imageEditable,
  pageStatusLabel as statusLabel,
  pageStatusTone as statusTone,
  pendingKind,
  toLocalInput,
};

export type Slot = "announcement" | "home_hero" | "home_mid" | "category_top";

const SLOTS: Record<Slot, string> = {
  announcement: "Duyuru çubuğu",
  home_hero: "Ana sayfa vitrini",
  home_mid: "Ana sayfa ortası",
  category_top: "Kategori sayfası üstü",
};

export const SLOT_KEYS = Object.keys(SLOTS) as [Slot, ...Slot[]];
export const slotLabel = (s: string) => SLOTS[s as Slot] ?? s;

/** The announcement bar is text; every other slot is led by an image. */
export const isImageSlot = (slot: string) => slot !== "announcement";

export const MESSAGE_MAX = 200;
export const LINK_MAX = 500;
export const ALT_MAX = 255;
export const POSITION_MAX = 10_000;

const OVERRIDE: Partial<Record<PageAction, Pick<ActionSpec, "success">>> = {
  submit: { success: "Banner onaya gönderildi." },
  withdraw: { success: "Banner geri çekildi." },
  publish: { success: "Banner yayınlandı." },
  unpublish: { success: "Banner yayından kaldırıldı." },
};

export function availableActions(state: PageState, who: Viewer): ActionSpec[] {
  return pageActions(state, who).map((a) => ({ ...a, ...OVERRIDE[a.action] }));
}

/** Why the fields cannot be saved, or what a save does. */
export function editNote(state: PageState, who: Viewer): string | null {
  const target = editTarget(state, who);
  if (who.owner)
    return target === "none"
      ? "Bekleyen bir değişiklik var; banner'ı düzenlemeden önce onaylayın veya reddedin."
      : null;
  if (target === "pending-change")
    return "Yayındaki banner'da yaptığınız değişiklik sahibin onayına gider; onaylanana kadar yayında olan sürüm görünür.";
  if (state.status === "pending_approval")
    return "Onay bekleyen banner düzenlenemez; önce geri çekin.";
  if (state.status === "unpublished")
    return "Yayından kaldırılan banner'ı yalnızca sahip düzenleyebilir.";
  return null;
}

export function imageNote(state: PageState, who: Viewer): string | null {
  if (imageEditable(state, who)) return null;
  if (state.status === "pending_approval")
    return "Onay bekleyen banner'ın görselleri değiştirilemez; önce geri çekin.";
  return "Görselleri yalnızca sahip değiştirebilir; yayındaki banner'larda görseller bekleyen değişikliğin parçası değildir.";
}

/** The Banner's own fields, as a draft in the form holds them. */
export type BannerFields = {
  slot: string;
  message: string;
  link: string;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
  category_id: number | null;
};

export type FieldKey = "message" | "link" | "position" | "ends";

/** The rules the API applies, so the form can say so before saving. */
export function checkFields(f: {
  slot: string;
  message: string;
  link: string;
  position: string;
  starts: string;
  ends: string;
}): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!isImageSlot(f.slot)) {
    if (!f.message.trim()) errors.message = "Duyuru için bir mesaj yazın.";
    else if (f.message.length > MESSAGE_MAX)
      errors.message = `Mesaj en fazla ${MESSAGE_MAX} karakter olabilir.`;
  }
  const link = f.link.trim();
  if (link.length > LINK_MAX) errors.link = `Bağlantı en fazla ${LINK_MAX} karakter olabilir.`;
  else if (link && !(/^\/(?!\/)/.test(link) || /^https:\/\//i.test(link)))
    errors.link = "Bağlantı / ile ya da https:// ile başlamalı.";
  const position = Number(f.position);
  if (
    f.position.trim() === "" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > POSITION_MAX
  )
    errors.position = `Sıra 0 ile ${POSITION_MAX} arasında olmalı.`;
  const start = fromLocalInput(f.starts);
  const end = fromLocalInput(f.ends);
  if (start && end && new Date(end) <= new Date(start))
    errors.ends = "Bitiş tarihi başlangıçtan sonra olmalı.";
  return errors;
}

/** What is still missing before a Banner can be shown, for the Owner and Staff to see
 * before it goes for approval. The storefront hides an incomplete Banner. */
export function completeness(b: {
  slot: string;
  message: string;
  image: { alt_text: string } | null;
}): string[] {
  if (!isImageSlot(b.slot)) return b.message.trim() ? [] : ["Duyuru mesajı yok."];
  return b.image ? [] : ["Görsel yüklenmemiş."];
}

/** Things worth a look before publishing that do not stop the Banner from showing. */
export function warnings(b: { slot: string; image: { alt_text: string } | null }): string[] {
  if (isImageSlot(b.slot) && b.image && !b.image.alt_text.trim())
    return ["Görselin alternatif metni yok; ekran okuyucular görseli atlar."];
  return [];
}

/** Whether the Delete button is offered: the Owner may delete any Banner, Staff only a draft. */
export function canDelete(state: PageState, who: Viewer): boolean {
  return who.owner || state.status === "draft";
}

export const FIELD_LABELS: Record<keyof BannerFields, string> = {
  slot: "Alan",
  message: "Mesaj",
  link: "Bağlantı",
  position: "Sıra",
  starts_at: "Başlangıç",
  ends_at: "Bitiş",
  category_id: "Kategori",
};

export function changedFields(live: BannerFields, change: Partial<BannerFields>) {
  return (Object.keys(FIELD_LABELS) as (keyof BannerFields)[])
    .filter((k) => k in change && (change[k] ?? null) !== (live[k] ?? null))
    .map((k) => ({ field: k, label: FIELD_LABELS[k], before: live[k], after: change[k] ?? null }));
}
