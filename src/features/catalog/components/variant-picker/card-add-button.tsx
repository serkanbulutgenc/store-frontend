import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { singleVariant } from "../../product-options";
import { type ProductCard, type ProductDetail, productQuery } from "../../queries";
import { useAddWithToast } from "./use-variant-pick";
import { VariantPickerDialog } from "./variant-picker-dialog";

/**
 * The bag button on the bottom right of a card's photo. An in-stock Single-Variant Product is
 * added at once; any other opens the Variant picker. Cards carry no Variants, so the Product is
 * fetched on click.
 */
export function CardAddButton({ product }: { product: ProductCard }) {
  const queryClient = useQueryClient();
  const add = useAddWithToast();
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState<ProductDetail | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const busy = loading || add.pending;
  if (product.sold_out) return null;

  async function onClick() {
    if (busy) return;
    setLoading(true);
    try {
      // Always fresh: a cached Product could still show stock that has since sold out.
      const detail = await queryClient.query({ ...productQuery(product.slug), staleTime: 0 });
      const only = singleVariant(detail.variants);
      if (only?.in_stock) add.addVariant(only.id, 1);
      else setPicking(detail);
    } catch {
      toast.error("Ürün yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const Icon = busy ? LoaderCircle : ShoppingBag;
  return (
    <>
      {/* pl-[inherit] keeps the button on the photo when the card has left padding (rails). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 pl-[inherit]">
        <div className="relative aspect-[3/4] w-full">
          {/* Not `disabled` while busy: that would drop keyboard focus. */}
          <Button
            ref={button}
            size="icon"
            aria-label={`${product.title} sepete ekle`}
            aria-busy={busy}
            onClick={() => void onClick()}
            className="pointer-events-auto absolute bottom-2 right-2 size-10 rounded-md shadow"
          >
            <Icon className={busy ? "size-5 animate-spin" : "size-5"} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {picking && (
        <VariantPickerDialog
          product={picking}
          onClose={() => setPicking(null)}
          returnFocus={button}
        />
      )}
    </>
  );
}
