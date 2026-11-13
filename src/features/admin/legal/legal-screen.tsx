import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/format";
import { legalPagesAdminQuery } from "./queries";

export function LegalScreen() {
  const { data: pages } = useSuspenseQuery(legalPagesAdminQuery);
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-lg font-semibold">Yasal sayfalar</h1>
      <p className="text-muted-foreground">
        Her kaydetme yeni bir sürüm oluşturur ve mağazada hemen yayınlanır. Eski sürümler silinmez
        ve değiştirilemez; verilen onaylar hangi sürümü gördüğünü saklar.
      </p>
      <ul className="divide-y rounded-md border">
        {pages.map((p) => (
          <li key={p.page} className="flex items-center justify-between gap-3 px-3 py-2">
            <div>
              <Link
                to="/admin/legal-pages/$page"
                params={{ page: p.page }}
                className="font-medium text-primary underline"
              >
                {p.title}
              </Link>
              <p className="text-muted-foreground">
                Sürüm {p.version} · {formatDate(p.created_at)}
                {p.created_by ? ` · ${p.created_by}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
