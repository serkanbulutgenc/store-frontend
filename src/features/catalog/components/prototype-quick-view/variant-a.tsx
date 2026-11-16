// PROTOTYPE variant A: hover bar on the image (eye = quick view, bag = size strip, tap a size = add).
// Quick view is a centred two-column modal that mirrors the product page.
import { Link } from "@tanstack/react-router";
import { Eye, ShoppingBag, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProductCard, ProductDetail } from "../../queries";
import { Price } from "../product-card";
import { ProductImage } from "../product-image";
import { ColourChips, SizeChips } from "./parts";
import { type QuickPick, useQuickPick, useQuickProduct } from "./use-quick-pick";

export function CardActionsA({ product }: { product: ProductCard }) {
  const [strip, setStrip] = useState(false);
  const [view, setView] = useState(false);
  if (product.sold_out) return null;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4]">
        <div className="pointer-events-auto absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-md bg-background/95 p-1.5 opacity-0 shadow transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          {strip ? (
            <StripSizes slug={product.slug} onClose={() => setStrip(false)} />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView(true)}
                className="flex items-center gap-1.5 px-1 text-sm font-medium"
              >
                <Eye className="size-4" /> Hızlı bakış
              </button>
              <Button size="icon" aria-label="Sepete ekle" onClick={() => setStrip(true)}>
                <ShoppingBag className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <Dialog.Root open={view} onOpenChange={setView}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-background p-5 shadow-xl">
            <Dialog.Close aria-label="Kapat" className="absolute right-3 top-3">
              <X className="size-5" />
            </Dialog.Close>
            <Dialog.Title className="sr-only">{product.title}</Dialog.Title>
            <Dialog.Description className="sr-only">Hızlı ürün önizlemesi</Dialog.Description>
            <ModalBody slug={product.slug} onDone={() => setView(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function StripSizes({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data } = useQuickProduct(slug, true);
  if (!data) return <p className="px-1 text-sm">Yükleniyor…</p>;
  return <StripInner product={data} onClose={onClose} />;
}
function StripInner({ product, onClose }: { product: ProductDetail; onClose: () => void }) {
  const pick = useQuickPick(product);
  return (
    <>
      <SizeChips pick={pick} onPick={(id) => pick.addVariant(id, onClose)} />
      <button type="button" aria-label="Kapat" onClick={onClose}>
        <X className="size-4" />
      </button>
    </>
  );
}

function ModalBody({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { data } = useQuickProduct(slug, true);
  if (!data) return <p className="p-10 text-center">Yükleniyor…</p>;
  return <ModalInner product={data} onDone={onDone} />;
}
function ModalInner({ product, onDone }: { product: ProductDetail; onDone: () => void }) {
  const pick = useQuickPick(product);
  const [picked, setPicked] = useState<number | null>(null);
  const current = pick.photos.find((p) => p.id === picked) ?? pick.photos[0] ?? product.image;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <ProductImage image={current} sizes="(min-width: 768px) 28rem, 100vw" eager />
        {pick.photos.length > 1 && (
          <ul className="grid grid-cols-5 gap-2">
            {pick.photos.slice(0, 5).map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-label={`Fotoğraf ${i + 1}`}
                  onClick={() => setPicked(p.id)}
                >
                  <ProductImage image={p} sizes="80px" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-4">
        {product.brand && <p className="text-muted-foreground">{product.brand.name}</p>}
        <h2 className="text-xl font-semibold">{product.title}</h2>
        <Price price={product.price} oldPrice={product.old_price} />
        <ColourChips product={product} pick={pick} />
        <SizeChips pick={pick} />
        <p aria-live="polite" className="min-h-5 text-sm font-medium text-primary">
          {pick.label}
        </p>
        <Button
          size="lg"
          className="w-full"
          disabled={!pick.addable || pick.pending}
          onClick={() => pick.addPicked(onDone)}
        >
          {pick.size ? "Sepete ekle" : "Beden seçin"}
        </Button>
        {product.description && (
          <p className="line-clamp-4 text-sm text-muted-foreground">{product.description}</p>
        )}
        <Link
          to="/urun/$slug"
          params={{ slug: product.slug }}
          className="block text-sm underline underline-offset-4"
        >
          Tüm ürün detayları
        </Link>
      </div>
    </div>
  );
}

export type { QuickPick };
