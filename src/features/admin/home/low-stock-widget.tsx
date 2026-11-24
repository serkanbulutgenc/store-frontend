import { Link } from "@tanstack/react-router";
import type { HomeData } from "../returns/queries";
import { PREVIEW_ROWS, WidgetCard } from "./widget-card";

/** Variants running low. Read-only: the Stok screen is where counts are corrected. */
export function LowStockWidget({ data }: { data: NonNullable<HomeData["low_stock"]> }) {
  return (
    <WidgetCard
      id="widget-low-stock"
      title="Azalan stok"
      count={data.count}
      empty="Stoğu azalan ürün yok."
      seeAll={
        <Link to="/admin/stock" className="text-primary underline">
          Tümünü gör ({data.count})
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {data.rows.slice(0, PREVIEW_ROWS).map((v) => (
          <li key={v.variant_id} className="flex flex-wrap justify-between gap-2 py-1">
            <Link
              to="/admin/products/$productId"
              params={{ productId: String(v.product_id) }}
              className="underline-offset-2 hover:underline"
            >
              {v.title}
            </Link>
            <span className="text-muted-foreground">
              {v.colour} · {v.size}
            </span>
            <span>{v.on_hand} adet</span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
