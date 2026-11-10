import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { formatDate, formatTry } from "@/lib/format";
import { paymentLabel, statusLabel } from "../labels";
import { type TrackedOrder, trackingLinkQuery, useTrackOrder } from "../queries";

export function OrderView({ order }: { order: TrackedOrder }) {
  return (
    <section
      aria-labelledby="order"
      className="space-y-4 rounded-md border border-border bg-card p-4"
    >
      <div>
        <h2 id="order" className="text-lg font-semibold">
          Sipariş {order.number}
        </h2>
        <p className="text-muted-foreground">{formatDate(order.placed_at)}</p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Durum</dt>
        <dd className="font-medium">{statusLabel(order.status)}</dd>
        <dt className="text-muted-foreground">Ödeme</dt>
        <dd>
          {paymentLabel(order.payment_status)} ·{" "}
          {order.payment_method === "cod" ? "Kapıda ödeme" : "Havale / EFT"}
        </dd>
        {order.tracking_number && (
          <>
            <dt className="text-muted-foreground">Kargo</dt>
            <dd>
              {order.carrier ? `${order.carrier} · ` : ""}
              <span className="font-mono">{order.tracking_number}</span>
            </dd>
          </>
        )}
      </dl>
      <ul className="divide-y divide-border">
        {order.lines.map((l) => (
          <li key={l.sku} className="flex justify-between gap-3 py-2">
            <span>
              {l.quantity} × {l.title}
              <span className="block text-muted-foreground">
                {l.colour} · {l.size}
              </span>
            </span>
            <span>{formatTry(l.line_total)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-border pt-2">
        <div className="flex justify-between">
          <dt>Ürünler</dt>
          <dd>{formatTry(order.items_total)}</dd>
        </div>
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
    </section>
  );
}

function LookupForm({ onFound }: { onFound: (o: TrackedOrder) => void }) {
  const track = useTrackOrder();
  const [number, setNumber] = useState("");
  const [contact, setContact] = useState("");
  const error = track.error instanceof ApiError ? track.error.message : null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        track.mutate({ number: number.trim(), contact: contact.trim() }, { onSuccess: onFound });
      }}
    >
      <div className="space-y-1">
        <label htmlFor="number" className="block font-medium">
          Sipariş numarası
        </label>
        <Input
          id="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="AT-ABC123"
          autoComplete="off"
          required
          className="h-11"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="contact" className="block font-medium">
          E-posta veya telefon
        </label>
        <Input
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          autoComplete="off"
          required
          className="h-11"
        />
        <span className="block text-muted-foreground">
          Siparişte kullandığınız e-posta adresi ya da telefon numarası.
        </span>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={track.isPending}>
        Siparişi sorgula
      </Button>
    </form>
  );
}

function linkProblem(error: unknown): string {
  if (error instanceof ApiError && error.status === 404)
    return "Bu bağlantı geçersiz veya süresi dolmuş. Sipariş numaranız ve e-posta ya da telefonunuzla sorgulayabilirsiniz.";
  if (error instanceof ApiError && error.status === 429)
    return "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
  return "Sipariş şu anda yüklenemedi. Lütfen sayfayı yenileyin.";
}

export function TrackingPage({ token }: { token: string | undefined }) {
  const link = useQuery({ ...trackingLinkQuery(token ?? ""), enabled: Boolean(token) });
  const [found, setFound] = useState<TrackedOrder | null>(null);
  const [other, setOther] = useState(false);
  const order = other ? null : (found ?? link.data ?? null);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Sipariş takibi</h1>
      {token && !other && link.isPending && (
        <div className="h-32 animate-pulse rounded-md bg-muted" aria-busy="true" />
      )}
      {token && !other && link.isError && !found && (
        <p role="alert" className="rounded-md bg-muted px-3 py-2">
          {linkProblem(link.error)}
        </p>
      )}
      {order && <OrderView order={order} />}
      {order && (
        <Button
          variant="outline"
          onClick={() => {
            setFound(null);
            setOther(true);
          }}
        >
          Başka bir siparişi sorgula
        </Button>
      )}
      {!order && !(token && link.isPending && !other) && (
        <LookupForm
          onFound={(o) => {
            setOther(false);
            setFound(o);
          }}
        />
      )}
    </main>
  );
}
