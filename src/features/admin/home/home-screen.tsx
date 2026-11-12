import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/format";
import { homeQuery } from "../returns/queries";
import { returnReasonLabel } from "../returns/rules";

/** Ana sayfa: what needs Staff attention. Starts with return requests awaiting a decision. */
export function HomeScreen() {
  const { data } = useSuspenseQuery(homeQuery());
  const returns = data.open_returns;
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Ana sayfa</h1>
      <section
        aria-labelledby="open-returns"
        className="space-y-2 rounded-md border border-border bg-card p-4"
      >
        <h2 id="open-returns" className="font-semibold">
          Bekleyen iade talepleri ({returns.count})
        </h2>
        {returns.count === 0 ? (
          <p className="text-muted-foreground">Karar bekleyen iade talebi yok.</p>
        ) : (
          <ul className="divide-y divide-border">
            {returns.rows.map((r) => (
              <li key={r.return_id} className="flex flex-wrap justify-between gap-2 py-1">
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
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/admin/returns"
          search={{ status: "requested" }}
          className="text-primary underline"
        >
          Tüm iade talepleri
        </Link>
      </section>
    </div>
  );
}
