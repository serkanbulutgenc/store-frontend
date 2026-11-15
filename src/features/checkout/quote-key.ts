/**
 * The cache key of a checkout quote: everything that changes what the basket costs. The Voucher
 * is part of it, so applying or removing a code asks the backend again instead of showing the
 * old total.
 */
export function checkoutQuoteKey(
  basket: {
    subtotal: string;
    lines: { id: number; quantity: number }[];
    voucher?: { code: string; problem?: string | null } | null;
  },
  province: string,
  method: string,
) {
  const lines = basket.lines.map((l) => `${l.id}:${l.quantity}`).join(",");
  const voucher = basket.voucher ? `${basket.voucher.code}:${basket.voucher.problem ?? ""}` : "";
  return [
    "store",
    "checkout-quote",
    { lines, subtotal: basket.subtotal, voucher, province, method },
  ];
}
