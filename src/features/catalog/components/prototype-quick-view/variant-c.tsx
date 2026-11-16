// PROTOTYPE variant C: no overlay on the image. A permanent "Sepete ekle" row sits under the card;
// it expands inline into size chips (tap a size = add). "Hızlı bakış" opens a bottom sheet with a
// swipeable photo strip.
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ProductCard, ProductDetail } from "../../queries";
import { Price } from "../product-card";
import { ProductImage } from "../product-image";
import { ColourChips, SizeChips } from "./parts";
import { useQuickPick, useQuickProduct } from "./use-quick-pick";

/** Rendered below the card link (not absolute), so the card grows when sizes open. */
export function CardActionsC({ product }: { product: ProductCard }) {
  const [sizes, setSizes] = useState(false);
  const [view, setView] = useState(false);
  if (product.sold_out) return null;
  return (
    <div className="mt-2 space-y-2">
      {sizes ? (
        <InlineSizes slug={product.slug} onDone={() => setSizes(false)} />
      ) : (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => setSizes(true)}>
            Sepete ekle
          </Button>
          <Button size="sm" variant="outline" onClick={() => setView(true)}>
            Hızlı bakış
          </Button>
        </div>
      )}
      <Sheet open={view} onOpenChange={setView}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{product.title}</SheetTitle>
            <SheetDescription className="sr-only">Hızlı ürün önizlemesi</SheetDescription>
          </SheetHeader>
          <Preview slug={product.slug} onDone={() => setView(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InlineSizes({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { data } = useQuickProduct(slug, true);
  if (!data) return <p className="text-sm text-muted-foreground">Bedenler yükleniyor…</p>;
  return <InlineInner product={data} onDone={onDone} />;
}
function InlineInner({ product, onDone }: { product: ProductDetail; onDone: () => void }) {
  const pick = useQuickPick(product);
  return (
    <div className="space-y-2 rounded-md border border-border p-2">
      <p className="text-sm font-medium">Beden seçin</p>
      <ColourChips product={product} pick={pick} />
      <SizeChips pick={pick} onPick={(id) => pick.addVariant(id, onDone)} />
      <button type="button" className="text-xs underline" onClick={onDone}>
        Vazgeç
      </button>
    </div>
  );
}

function Preview({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { data } = useQuickProduct(slug, true);
  if (!data) return <p className="p-4">Yükleniyor…</p>;
  return <PreviewInner product={data} onDone={onDone} />;
}
function PreviewInner({ product, onDone }: { product: ProductDetail; onDone: () => void }) {
  const pick = useQuickPick(product);
  const photos = pick.photos.length ? pick.photos : product.image ? [product.image] : [];
  return (
    <>
      <div className="space-y-4">
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4">
          {photos.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: prototype
            <li key={i} className="w-56 shrink-0 snap-center">
              <ProductImage image={p} sizes="224px" />
            </li>
          ))}
        </ul>
        <div className="space-y-3 px-4">
          <Price price={product.price} oldPrice={product.old_price} />
          <ColourChips product={product} pick={pick} />
          <SizeChips pick={pick} />
          <p aria-live="polite" className="min-h-5 text-sm font-medium text-primary">
            {pick.label}
          </p>
          {product.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>
      </div>
      <SheetFooter className="sticky bottom-0 border-t bg-background sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          disabled={!pick.addable || pick.pending}
          onClick={() => pick.addPicked(onDone)}
        >
          {pick.size ? "Sepete ekle" : "Beden seçin"}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/urun/$slug" params={{ slug: product.slug }}>
            Detay
          </Link>
        </Button>
      </SheetFooter>
    </>
  );
}
