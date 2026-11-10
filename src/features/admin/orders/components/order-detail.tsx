import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Me } from "@/lib/api/me";
import { formatDate, formatTry } from "@/lib/format";
import { orderQuery } from "../queries";
import {
  orderStatusLabel,
  orderStatusTone,
  type PaymentStatus,
  paymentLabel,
  paymentTone,
} from "../rules";
import { OrderActions } from "./order-actions";

const PAYMENT_METHOD: Record<string, string> = { cod: "Kapıda ödeme", bank_transfer: "Havale/EFT" };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

export function OrderDetailScreen({ number, me }: { number: string; me: Me }) {
  const { data: o } = useSuspenseQuery(orderQuery(number));
  const payment = o.payment_status as PaymentStatus;
  const addr = o.shipping_address;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/admin/orders" className="text-muted-foreground underline">
          Siparişler
        </Link>
        <h1 className="font-mono text-lg font-semibold">{o.number}</h1>
        <Badge tone={orderStatusTone(o.status)}>{orderStatusLabel(o.status)}</Badge>
        <Badge tone={paymentTone[payment]}>{paymentLabel(payment)}</Badge>
        <span className="text-muted-foreground">{formatDate(o.placed_at)}</span>
      </div>

      <OrderActions order={o} me={me} />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Müşteri ve teslimat</h2>
          <dl className="space-y-1">
            <Row label="E-posta">{o.email}</Row>
            <Row label="Ad soyad">{addr?.full_name}</Row>
            <Row label="Telefon">{addr?.phone}</Row>
            <Row label="Adres">
              {addr &&
                `${addr.street}, ${addr.mahalle}, ${addr.ilce}/${addr.il} ${addr.postal_code}`}
            </Row>
            <Row label="Vergi no">{o.buyer_tax_number}</Row>
            <Row label="Şirket unvanı">{o.company_title}</Row>
          </dl>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Ödeme ve kargo</h2>
          <dl className="space-y-1">
            <Row label="Ödeme yöntemi">{PAYMENT_METHOD[o.payment_method] ?? o.payment_method}</Row>
            <Row label="Ödenen">
              {o.paid_amount &&
                `${formatTry(o.paid_amount)}${o.paid_at ? ` · ${formatDate(o.paid_at)}` : ""}`}
            </Row>
            <Row label="Kargo">{o.carrier && `${o.carrier} · ${o.tracking_number}`}</Row>
            <Row label="Kargolandı">{o.shipped_at && formatDate(o.shipped_at)}</Row>
            <Row label="Teslim">{o.delivered_at && formatDate(o.delivered_at)}</Row>
            <Row label="İptal gerekçesi">{o.cancel_reason}</Row>
            <Row label="İade">
              {o.refund_amount &&
                `${formatTry(o.refund_amount)} · ${o.refund_method === "cash" ? "Nakit" : "Havale/EFT"}${
                  o.refund_iban ? ` · ${o.refund_iban}` : ""
                }${o.refunded_at ? ` · ${formatDate(o.refunded_at)}` : ""}`}
            </Row>
          </dl>
        </section>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Ürünler</h2>
        <p className="text-muted-foreground">
          Sipariş anındaki ürün adı ve fiyatlar; sonraki katalog değişikliklerinden etkilenmez.
        </p>
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Ürün</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Adet</TableHead>
                <TableHead>Birim fiyat</TableHead>
                <TableHead>Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {o.lines.map((l) => (
                <TableRow key={l.sku}>
                  <TableCell>
                    {l.title}
                    <span className="block text-muted-foreground">
                      {l.colour} / {l.size}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                  <TableCell>{l.quantity}</TableCell>
                  <TableCell>{formatTry(l.unit_price)}</TableCell>
                  <TableCell>{formatTry(l.line_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <dl className="ml-auto w-64 space-y-1">
          <Row label="Ürünler">{formatTry(o.items_total)}</Row>
          <Row label="Kargo">{formatTry(o.shipping_fee)}</Row>
          <Row label="Kapıda ödeme">{formatTry(o.cod_fee)}</Row>
          <Row label="Toplam">
            <strong>{formatTry(o.total)}</strong>
          </Row>
          <Row label="Dahil KDV">{formatTry(o.kdv_total)}</Row>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Geçmiş</h2>
        {o.audit.length === 0 ? (
          <p className="text-muted-foreground">Kayıt yok.</p>
        ) : (
          <ol className="space-y-1">
            {o.audit.map((a, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: append-only log, entries have no id
              <li key={i} className="flex gap-3">
                <time className="w-36 shrink-0 text-muted-foreground">{formatDate(a.at)}</time>
                <span>
                  {a.summary || a.action} <span className="text-muted-foreground">· {a.actor}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
