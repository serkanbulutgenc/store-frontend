import { useQuery } from "@tanstack/react-query";
import { Eye, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type ProductCard, type ProductDetail, productQuery } from "../../queries";
import { SizeChips } from "./option-chips";
import { QuickViewDialog } from "./quick-view-dialog";
import { useQuickPick } from "./use-quick-pick";

/**
 * Bar over the bottom of a card's photo: "Hızlı bakış" opens the preview dialog, the bag turns
 * the bar into size chips and tapping a size adds it. Visible on hover and focus; always visible
 * on small screens, where there is no hover.
 */
export function QuickActions({ product }: { product: ProductCard }) {
  const [sizesOpen, setSizesOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  if (product.sold_out) return null;
  return (
    <>
      {/* pl-[inherit] keeps the bar on the photo when the card has left padding (rails). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 pl-[inherit]">
        <div className="relative aspect-[3/4] w-full">
          <div
            className={
              "pointer-events-auto absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-md bg-background/95 p-1.5 shadow transition-opacity max-sm:opacity-100 " +
              (sizesOpen
                ? "opacity-100"
                : "opacity-0 focus-within:opacity-100 group-hover:opacity-100")
            }
          >
            {sizesOpen ? (
              <StripSizes slug={product.slug} onClose={() => setSizesOpen(false)} />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setViewOpen(true)}
                  className="flex items-center gap-1.5 rounded-md px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Eye className="size-4" /> Hızlı bakış
                </button>
                <Button
                  size="icon"
                  aria-label={`${product.title} sepete ekle`}
                  onClick={() => setSizesOpen(true)}
                >
                  <ShoppingBag className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {viewOpen && (
        <QuickViewDialog
          slug={product.slug}
          title={product.title}
          open={viewOpen}
          onOpenChange={setViewOpen}
        />
      )}
    </>
  );
}

function StripSizes({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data, isError } = useQuery(productQuery(slug));
  if (isError) return <p className="px-1 text-sm">Yüklenemedi</p>;
  if (!data) return <p className="px-1 text-sm">Yükleniyor…</p>;
  return <Strip product={data} onClose={onClose} />;
}

function Strip({ product, onClose }: { product: ProductDetail; onClose: () => void }) {
  const pick = useQuickPick(product);
  return (
    <>
      <SizeChips pick={pick} onPick={(id) => pick.addVariant(id, onClose)} />
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X className="size-4" />
      </button>
    </>
  );
}
