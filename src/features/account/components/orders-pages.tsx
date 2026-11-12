import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { OrderActions } from "@/features/tracking/components/order-actions";
import { OrderView } from "@/features/tracking/components/tracking-page";
import { paymentLabel, statusLabel } from "@/features/tracking/labels";
import { ApiError } from "@/lib/api/errors";
import { formatDate, formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import { orderQuery, ordersQuery } from "../queries";

export function OrdersPage({ page }: { page: number }) {
  const { data, isPending, isError } = useQuery(ordersQuery(page));
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <section aria-labelledby="orders" className="max-w-2xl space-y-4">
      <h1 id="orders" className="text-2xl font-semibold">
        Siparişlerim
      </h1>
      {isPending && <div className="h-24 animate-pulse rounded-md bg-muted" aria-busy="true" />}
      {isError && <p role="alert">Siparişleriniz yüklenemedi. Lütfen sayfayı yenileyin.</p>}
      {data && data.items.length === 0 && <p>Henüz siparişiniz yok.</p>}
      <ul className="space-y-3">
        {data?.items.map((o) => (
          <li key={o.number}>
            <Link
              to="/hesap/siparisler/$number"
              params={{ number: o.number }}
              className="flex flex-wrap justify-between gap-2 rounded-md border border-border bg-card p-4 hover:bg-accent"
            >
              <span>
                <strong>{o.number}</strong>
                <span className="block text-muted-foreground">{formatDate(o.placed_at)}</span>
              </span>
              <span className="text-right">
                {formatTry(o.total)}
                <span className="block text-muted-foreground">
                  {statusLabel(o.status)} · {paymentLabel(o.payment_status)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav aria-label="Sayfalar" className="flex gap-2">
          {page > 1 && (
            <Link
              to="/hesap/siparisler"
              search={{ page: page - 1 }}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Önceki
            </Link>
          )}
          {page < pages && (
            <Link
              to="/hesap/siparisler"
              search={{ page: page + 1 }}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}

export function OrderDetailPage({ number }: { number: string }) {
  const { data, isPending, error } = useQuery(orderQuery(number));
  const missing = error instanceof ApiError && error.status === 404;
  return (
    <section aria-label="Sipariş ayrıntısı" className="max-w-2xl space-y-4">
      <Link to="/hesap/siparisler" className="text-primary underline">
        ← Siparişlerim
      </Link>
      {isPending && <div className="h-32 animate-pulse rounded-md bg-muted" aria-busy="true" />}
      {error && <p role="alert">{missing ? "Sipariş bulunamadı." : "Sipariş yüklenemedi."}</p>}
      {data && (
        <>
          <OrderView order={data} />
          <OrderActions order={data} access={{ kind: "account", number }} />
          {data.shipping_address && (
            <section aria-labelledby="ship" className="rounded-md border border-border bg-card p-4">
              <h2 id="ship" className="mb-1 font-semibold">
                Teslimat adresi
              </h2>
              <address className="not-italic">
                {data.shipping_address.full_name}
                <br />
                {data.shipping_address.street}, {data.shipping_address.mahalle}
                <br />
                {data.shipping_address.ilce} / {data.shipping_address.il}{" "}
                {data.shipping_address.postal_code}
              </address>
            </section>
          )}
        </>
      )}
    </section>
  );
}
