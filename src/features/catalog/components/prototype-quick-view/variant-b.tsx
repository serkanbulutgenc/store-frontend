// PROTOTYPE variant B: a plus button on the image. Single-variant products add straight away;
// everything else opens a right-hand sheet that doubles as preview and add form.

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAddToBasket } from "@/features/basket/queries";
import { formatTry } from "@/lib/format";
import type { ProductCard, ProductDetail } from "../../queries";
import { productQuery } from "../../queries";
import { ProductImage } from "../product-image";
import { ColourChips, SizeChips } from "./parts";
import { useQuickPick, useQuickProduct } from "./use-quick-pick";

export function CardActionsB({ product }: { product: ProductCard }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const add = useAddToBasket();
  if (product.sold_out) return null;

  async function onPlus() {
    // Cheap trick for the prototype: if there is exactly one buyable variant, skip the sheet.
    const detail = await qc.fetchQuery(productQuery(product.slug));
    const buyable = detail.variants.filter((v) => v.in_stock);
    const only = buyable[0];
    if (detail.variants.length === 1 && only) {
      add.mutate(
        { variantId: only.id },
        {
          onSuccess: () => toast.success("Ürün sepete eklendi."),
          onError: (e) => toast.error(e.message),
        },
      );
    } else setOpen(true);
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4]">
        <Button
          size="icon"
          aria-label={`${product.title} hızlı ekle`}
          className="pointer-events-auto absolute bottom-2 right-2 size-10 rounded-full shadow-lg"
          disabled={add.isPending}
          onClick={() => void onPlus()}
        >
          <Plus className="size-5" />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{product.title}</SheetTitle>
            <SheetDescription>{formatTry(product.price)}</SheetDescription>
          </SheetHeader>
          <SheetBody slug={product.slug} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function SheetBody({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { data } = useQuickProduct(slug, true);
  if (!data) return <p className="p-4">Yükleniyor…</p>;
  return <SheetInner product={data} onDone={onDone} />;
}
function SheetInner({ product, onDone }: { product: ProductDetail; onDone: () => void }) {
  const pick = useQuickPick(product);
  return (
    <>
      <div className="space-y-4 px-4">
        <ProductImage
          image={pick.photos[0] ?? product.image}
          sizes="28rem"
          eager
          className="max-h-80 rounded-md"
        />
        <ColourChips product={product} pick={pick} />
        <SizeChips pick={pick} />
        <p aria-live="polite" className="min-h-5 text-sm font-medium text-primary">
          {pick.label}
        </p>
        {product.attributes.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {product.attributes.map((a) => (
              <div key={a.name} className="contents">
                <dt className="text-muted-foreground">{a.name}</dt>
                <dd>{a.values.join(", ")}</dd>
              </div>
            ))}
          </dl>
        )}
        {product.description && (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
        )}
      </div>
      <SheetFooter className="sticky bottom-0 border-t bg-background">
        <Button
          size="lg"
          disabled={!pick.addable || pick.pending}
          onClick={() => pick.addPicked(onDone)}
        >
          {pick.size ? "Sepete ekle" : "Beden seçin"}
        </Button>
        <Link
          to="/urun/$slug"
          params={{ slug: product.slug }}
          className="text-center text-sm underline"
        >
          Ürün sayfasına git
        </Link>
      </SheetFooter>
    </>
  );
}
