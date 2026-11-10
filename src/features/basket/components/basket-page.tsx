import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductImage } from "@/features/catalog/components/product-image";
import { formatTry } from "@/lib/format";
import { cn } from "@/lib/utils";
import { problemText } from "../problems";
import {
  type BasketLine,
  basketQuery,
  settingsQuery,
  useRemoveLine,
  useSetQuantity,
} from "../queries";

function LineRow({ line }: { line: BasketLine }) {
  const setQuantity = useSetQuantity();
  const remove = useRemoveLine();
  const busy = setQuantity.isPending || remove.isPending;
  const problem = problemText(line);
  const error = setQuantity.error ?? remove.error;
  return (
    <li className="flex gap-4 py-4">
      <Link to="/urun/$slug" params={{ slug: line.slug }} className="w-20 shrink-0">
        <ProductImage image={line.image} sizes="80px" className="w-full rounded-md" />
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex justify-between gap-3">
          <div>
            <Link
              to="/urun/$slug"
              params={{ slug: line.slug }}
              className="font-medium hover:underline"
            >
              {line.title}
            </Link>
            <p className="text-muted-foreground">
              {line.colour.name} · {line.size}
            </p>
          </div>
          <p className="font-semibold">{formatTry(line.line_total)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border bg-card">
            <button
              type="button"
              aria-label="Adedi azalt"
              disabled={busy || line.quantity <= 1}
              onClick={() => setQuantity.mutate({ lineId: line.id, quantity: line.quantity - 1 })}
              className="grid size-9 place-items-center disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Adedi artır"
              disabled={busy || line.available < 1 || line.quantity >= Math.min(line.available, 99)}
              onClick={() => setQuantity.mutate({ lineId: line.id, quantity: line.quantity + 1 })}
              className="grid size-9 place-items-center disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <span className="text-muted-foreground">{formatTry(line.unit_price)} / adet</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => remove.mutate(line.id)}
            className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Kaldır
          </button>
        </div>
        {(problem || error) && (
          <p role="alert" className="text-red-700">
            {problem ?? error?.message}
          </p>
        )}
        {line.is_hygiene && (
          <p className="text-muted-foreground">
            Hijyen nedeniyle ambalajı açıldıktan sonra iade edilemez.
          </p>
        )}
      </div>
    </li>
  );
}

export function BasketPage() {
  const { data: basket } = useQuery(basketQuery);
  const { data: settings } = useQuery(settingsQuery);

  if (!basket)
    return (
      <main className="mx-auto max-w-4xl px-4 py-8" aria-busy="true">
        <h1 className="mb-4 text-2xl font-semibold">Sepetim</h1>
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      </main>
    );

  if (basket.lines.length === 0)
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Sepetim</h1>
        <p>Sepetiniz boş.</p>
        <Link to="/ara" className={cn(buttonVariants())}>
          Alışverişe başla
        </Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Sepetim</h1>
      <div className="gap-10 lg:grid lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-border">
          {basket.lines.map((line) => (
            <LineRow key={line.id} line={line} />
          ))}
        </ul>
        <aside className="mt-6 h-fit space-y-3 rounded-md border border-border bg-card p-4 lg:mt-0">
          <div className="flex justify-between font-semibold">
            <span>Ara toplam (KDV dahil)</span>
            <span>{formatTry(basket.subtotal)}</span>
          </div>
          {settings && (
            <p className="text-muted-foreground">
              Kargo ücreti ve varsa kapıda ödeme bedeli ödeme adımında eklenir.
              {settings.free_shipping_threshold &&
                ` ${formatTry(settings.free_shipping_threshold)} ve üzeri siparişlerde kargo ücretsizdir.`}
            </p>
          )}
          {basket.has_problems && (
            <p role="alert" className="text-red-700">
              Sepetinizdeki bazı ürünler için sorun var. Devam etmeden önce düzeltin.
            </p>
          )}
          {basket.has_problems ? (
            <Button size="lg" className="w-full" disabled>
              Ödemeye geç
            </Button>
          ) : (
            <Link to="/odeme" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              Ödemeye geç
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
