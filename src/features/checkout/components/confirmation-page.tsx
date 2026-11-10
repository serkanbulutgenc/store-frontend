import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type PlacedOrder, placedOrderKey } from "../queries";

export function ConfirmationPage() {
  const qc = useQueryClient();
  // Written by the checkout mutation; never fetched.
  const { data: order } = useQuery<PlacedOrder | undefined>({
    queryKey: placedOrderKey,
    queryFn: () => qc.getQueryData<PlacedOrder>(placedOrderKey),
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  if (!order)
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Sipariş bilgisi bulunamadı</h1>
        <p>Siparişinizin ayrıntıları e-posta adresinize gönderilir.</p>
        <Link to="/" className={cn(buttonVariants())}>
          Ana sayfa
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Siparişiniz alındı</h1>
        <p className="mt-1">
          Sipariş numaranız: <strong>{order.number}</strong>. Onay e-postası {order.email} adresine
          gönderilir.
        </p>
      </div>

      {order.bank && (
        <section
          aria-labelledby="bank"
          className="space-y-2 rounded-md border border-border bg-card p-4"
        >
          <h2 id="bank" className="text-lg font-semibold">
            Havale / EFT bilgileri
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Banka</dt>
            <dd>{order.bank.name}</dd>
            <dt className="text-muted-foreground">Hesap sahibi</dt>
            <dd>{order.bank.account_holder}</dd>
            <dt className="text-muted-foreground">IBAN</dt>
            <dd className="font-mono">{order.bank.iban}</dd>
            <dt className="text-muted-foreground">Açıklama</dt>
            <dd className="font-mono">{order.bank.reference}</dd>
          </dl>
          <p className="text-muted-foreground">
            {formatTry(order.total)} tutarını 48 saat içinde gönderin ve açıklamaya sipariş
            numaranızı yazın. Aksi halde siparişiniz iptal edilir.
          </p>
        </section>
      )}
      {!order.bank && <p>Ödemeyi kapıda, teslimat sırasında yapacaksınız.</p>}

      <section aria-labelledby="items">
        <h2 id="items" className="mb-2 text-lg font-semibold">
          Sipariş özeti
        </h2>
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
        <dl className="mt-2 space-y-1 border-t border-border pt-2">
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

      <p>
        <Link
          to="/siparis-takip"
          search={{ t: order.tracking_token }}
          className="text-primary underline"
        >
          Siparişimi takip et
        </Link>{" "}
        <span className="text-muted-foreground">(bağlantı 30 gün geçerlidir)</span>
      </p>

      <section className="space-y-2 rounded-md bg-muted p-4">
        <h2 className="font-semibold">Hesap oluşturun</h2>
        <p>
          Siparişlerinizi takip etmek ve sonraki alışverişlerde zaman kazanmak için e-posta ve şifre
          ile hesap oluşturabilirsiniz.
        </p>
        <p className="text-muted-foreground">Hesap oluşturma yakında açılacaktır.</p>
      </section>

      <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
        Alışverişe devam et
      </Link>
    </main>
  );
}
