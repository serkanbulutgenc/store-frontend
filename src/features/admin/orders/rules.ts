import { can, type Me } from "@/lib/api/me";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

const STATUS: Record<string, string> = {
  new: "Yeni",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  return_requested: "İade talebi",
  returned: "İade edildi",
};
export const orderStatusLabel = (s: string) => STATUS[s] ?? s;
export const ORDER_STATUSES = Object.keys(STATUS);

export function orderStatusTone(s: string): "neutral" | "good" | "warn" {
  if (s === "delivered" || s === "completed") return "good";
  if (s === "cancelled" || s === "return_requested" || s === "returned") return "warn";
  return "neutral";
}

const PAYMENT: Record<PaymentStatus, string> = {
  unpaid: "Ödenmedi",
  paid: "Ödendi",
  refunded: "İade edildi",
};
export const PAYMENT_STATUSES = Object.keys(PAYMENT) as PaymentStatus[];
export const paymentLabel = (p: PaymentStatus) => PAYMENT[p];
export const paymentTone = { unpaid: "neutral", paid: "good", refunded: "warn" } as const;

export type OrderAction =
  | "mark_paid"
  | "cancel"
  | "ship"
  | "deliver"
  | "request_return"
  | "mark_returned"
  | "refund"
  | "edit_shipping";

export const ACTION_LABEL: Record<OrderAction, string> = {
  mark_paid: "Ödendi işaretle",
  cancel: "İptal et",
  ship: "Kargola",
  deliver: "Teslim edildi",
  request_return: "İade talebi",
  mark_returned: "İade alındı",
  refund: "İade öde",
  edit_shipping: "Adresi düzenle",
};

/**
 * Whether the user may perform an action. UX only: the API enforces every permission.
 * Cancelling a paid order and refunds are Owner-only; the rest follow the order permissions.
 */
export function canDo(
  me: Me | null,
  action: OrderAction,
  order: { payment_status: PaymentStatus },
): boolean {
  switch (action) {
    case "mark_paid":
      return can(me, "mark_paid");
    case "refund":
      return can(me, "record_refunds");
    case "cancel":
      return (
        can(me, "manage_orders") &&
        (order.payment_status !== "paid" || can(me, "cancel_paid_orders"))
      );
    default:
      return can(me, "manage_orders");
  }
}

/** The actions the API says are legal now, minus those the user may not perform. */
export function allowedActions(
  me: Me | null,
  order: { actions: string[]; payment_status: PaymentStatus },
): OrderAction[] {
  return order.actions.filter(
    (a): a is OrderAction => Object.hasOwn(ACTION_LABEL, a) && canDo(me, a as OrderAction, order),
  );
}

type Row = { status: string; payment_status: PaymentStatus };

/** Mirrors the API's legality for the two bulk actions; the API stays the judge. */
export const canBulkMarkPaid = (r: Row) =>
  r.payment_status === "unpaid" &&
  !["cancelled", "return_requested", "returned"].includes(r.status);
export const canBulkShip = (r: Row) => r.status === "preparing";
