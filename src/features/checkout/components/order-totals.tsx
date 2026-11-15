import { formatTry } from "@/lib/format";
import type { PlacedOrder } from "../queries";

export type OrderTotalsProps = {
  order: Pick<
    PlacedOrder,
    | "items_total"
    | "discount"
    | "voucher_code"
    | "shipping_fee"
    | "cod_fee"
    | "total"
    | "payment_method"
  >;
};

/** The figures under a placed Order's lines: items, Voucher, shipping, COD fee and total. */
export function OrderTotals({ order }: OrderTotalsProps) {
  const hasVoucher = order.voucher_code && Number(order.discount) > 0;
  return (
    <dl className="mt-2 space-y-1 border-t border-border pt-2">
      <div className="flex justify-between">
        <dt>Ürünler</dt>
        <dd>{formatTry(order.items_total)}</dd>
      </div>
      {hasVoucher && (
        <div className="flex justify-between">
          <dt>{`Kupon (${order.voucher_code})`}</dt>
          <dd>{`−${formatTry(order.discount)}`}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Kargo</dt>
        <dd>{formatTry(order.shipping_fee)}</dd>
      </div>
      {order.payment_method === "cod" && (
        <div className="flex justify-between">
          <dt>Kapıda ödeme bedeli</dt>
          <dd>{formatTry(order.cod_fee)}</dd>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold">
        <dt>Toplam</dt>
        <dd>{formatTry(order.total)}</dd>
      </div>
    </dl>
  );
}
