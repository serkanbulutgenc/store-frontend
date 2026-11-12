import type { components } from "../../../api/specs/openapi-store";

type ReturnReason = components["schemas"]["ReturnReason"];

export const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "wrong_size", label: "Beden uymadı" },
  { value: "changed_mind", label: "Vazgeçtim" },
  { value: "defective", label: "Ürün kusurlu" },
  { value: "wrong_item", label: "Yanlış ürün gönderildi" },
  { value: "other", label: "Diğer" },
];

const STATUS: Record<string, string> = {
  requested: "İnceleniyor",
  approved: "Onaylandı, ürünleri gönderebilirsiniz",
  rejected: "Reddedildi",
  received: "Ürünler bize ulaştı",
  refunded: "Ödeme iadesi yapıldı",
};

/** Turkish label for a return request status; an unknown value is shown as is. */
export const returnStatusLabel = (status: string) => STATUS[status] ?? status;

export const reasonLabel = (reason: string) =>
  RETURN_REASONS.find((r) => r.value === reason)?.label ?? reason;

/** The shop pays the return carrier when the fault is the shop's. */
export const shopPaysReturnShipping = (reason: string) =>
  reason === "defective" || reason === "wrong_item";

export const returnShippingNote = (reason: string) =>
  shopPaysReturnShipping(reason)
    ? "İade kargo ücretini mağazamız öder."
    : "İade kargo ücretini siz ödersiniz.";

export type ReturnAvailability =
  | { kind: "none" } // nothing delivered yet, so nothing to say
  | { kind: "closed" } // the 14 days are over
  | { kind: "nothing_left" } // every line is hygiene or already requested
  | { kind: "open"; until: string };

type Order = {
  return_deadline: string | null;
  lines: { returnable_quantity: number }[];
};

export function returnAvailability(order: Order, now = new Date()): ReturnAvailability {
  if (!order.return_deadline) return { kind: "none" };
  if (now.getTime() > new Date(order.return_deadline).getTime()) return { kind: "closed" };
  if (!order.lines.some((l) => l.returnable_quantity > 0)) return { kind: "nothing_left" };
  return { kind: "open", until: order.return_deadline };
}

/** The request body from the ticked lines; lines with quantity 0 are left out. */
export function returnBody(quantities: Record<number, number>, reason: ReturnReason, note: string) {
  return {
    reason,
    note: note.trim(),
    lines: Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({ line_id: Number(id), quantity })),
  };
}
