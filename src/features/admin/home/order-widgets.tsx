import { Link } from "@tanstack/react-router";
import { formatDate, formatTry } from "@/lib/format";
import type { HomeData } from "../returns/queries";
import { PREVIEW_ROWS, WidgetCard } from "./widget-card";

type NewOrders = NonNullable<HomeData["new_orders"]>;
type Expiring = NonNullable<HomeData["unpaid_transfers_near_expiry"]>;

function OrderRow({
  number,
  customer,
  total,
  when,
}: {
  number: string;
  customer: string;
  total: string;
  when: string;
}) {
  return (
    <li className="flex flex-wrap justify-between gap-2 py-1">
      <Link
        to="/admin/orders/$number"
        params={{ number }}
        className="font-mono text-xs underline-offset-2 hover:underline"
      >
        {number}
      </Link>
      <span>
        {customer} · {formatTry(total)}
      </span>
      <span className="text-muted-foreground">{when}</span>
    </li>
  );
}

/** New Orders nobody has picked up yet. Read-only: the Order's own screen holds the actions. */
export function NewOrdersWidget({ data }: { data: NewOrders }) {
  return (
    <WidgetCard
      id="widget-new-orders"
      title="Yeni siparişler"
      count={data.count}
      empty="Bekleyen yeni sipariş yok."
      seeAll={
        <Link to="/admin/orders" search={{ status: "new" }} className="text-primary underline">
          Tümünü gör ({data.count})
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {data.rows.slice(0, PREVIEW_ROWS).map((o) => (
          <OrderRow
            key={o.number}
            number={o.number}
            customer={o.customer}
            total={o.total}
            when={formatDate(o.placed_at)}
          />
        ))}
      </ul>
    </WidgetCard>
  );
}

/** Bank transfers still unpaid in the last stretch of their payment window. */
export function UnpaidTransfersWidget({ data }: { data: Expiring }) {
  return (
    <WidgetCard
      id="widget-unpaid-transfers"
      title="Süresi dolmak üzere olan havaleler"
      count={data.count}
      empty="Süresi dolmak üzere olan havale yok."
      seeAll={
        <Link
          to="/admin/orders"
          search={{ status: "new", payment_status: "unpaid" }}
          className="text-primary underline"
        >
          Tümünü gör ({data.count})
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {data.rows.slice(0, PREVIEW_ROWS).map((o) => (
          <OrderRow
            key={o.number}
            number={o.number}
            customer={o.customer}
            total={o.total}
            when={`son: ${formatDate(o.expires_at)}`}
          />
        ))}
      </ul>
    </WidgetCard>
  );
}
