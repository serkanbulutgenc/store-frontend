import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { can, type Me } from "@/lib/api/me";
import { formatDate } from "@/lib/format";
import type { HomeData } from "../returns/queries";
import { useApproveReturn } from "../returns/queries";
import { returnReasonLabel } from "../returns/rules";
import { PREVIEW_ROWS, WidgetCard } from "./widget-card";

type Row = NonNullable<HomeData["open_returns"]>["rows"][number];

/** Return requests waiting for a decision. Approve is a Quick action; Reject needs a reason, so
 * it lives on the order's own screen. */
export function ReturnsWidget({
  data,
  me,
}: {
  data: NonNullable<HomeData["open_returns"]>;
  me: Me | null;
}) {
  const [target, setTarget] = useState<Row | null>(null);
  const approve = useApproveReturn();
  const canDecide = can(me, "manage_orders");
  return (
    <WidgetCard
      id="widget-open-returns"
      title="Bekleyen iade talepleri"
      count={data.count}
      empty="Karar bekleyen iade talebi yok."
      seeAll={
        <Link
          to="/admin/returns"
          search={{ status: "requested" }}
          className="text-primary underline"
        >
          Tümünü gör ({data.count})
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {data.rows.slice(0, PREVIEW_ROWS).map((r) => (
          <li key={r.return_id} className="flex flex-wrap items-center justify-between gap-2 py-1">
            <Link
              to="/admin/orders/$number"
              params={{ number: r.number }}
              className="font-mono text-xs underline-offset-2 hover:underline"
            >
              {r.number}
            </Link>
            <span>
              {r.customer} · {r.item_count} adet · {returnReasonLabel(r.reason)}
            </span>
            <span className="text-muted-foreground">{formatDate(r.placed_at)}</span>
            {canDecide && (
              <Button size="sm" variant="outline" onClick={() => setTarget(r)}>
                Onayla
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Dialog open={target !== null} onClose={() => setTarget(null)} title="İade talebini onayla">
        {target && (
          <div className="space-y-3">
            <p>
              {target.number} numaralı siparişin iade talebi kabul edilecek. Müşteriye, iade kargo
              ücretini kimin ödeyeceğini bildiren bir e-posta gönderilir.
            </p>
            <p className="text-muted-foreground">
              Reddetmek için bir gerekçe gerekir: siparişin sayfasını açın.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTarget(null)}>
                Vazgeç
              </Button>
              <Button
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate(
                    { number: target.number, id: target.return_id },
                    {
                      onSuccess: () => {
                        toast.success("İade talebi onaylandı.");
                        setTarget(null);
                      },
                    },
                  )
                }
              >
                Onayla
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </WidgetCard>
  );
}
