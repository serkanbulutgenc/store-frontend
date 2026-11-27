import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { NotifyMe } from "@/features/stock-alerts/components/notify-me";
import { addLabel } from "../../product-options";
import { type ProductDetail, productQuery } from "../../queries";
import { Price } from "../product-card";
import { ProductImage } from "../product-image";
import { SizePickerExtras } from "../size-guide";
import { ColourChips, HygieneNotice, QuantityStepper, SizeChips } from "./options";
import { useVariantPick } from "./use-variant-pick";

/** A bottom sheet on phones, a centred dialog from `md` up. */
export function VariantPickerDialog({
  product,
  onClose,
  returnFocus,
}: {
  product: ProductDetail;
  onClose: () => void;
  /** There is no Radix trigger, so the opener says where focus goes back to. */
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  // Follows the cache, so a refetch (a Stock alert on a restocked Size) updates the picker.
  const { data = product } = useQuery(productQuery(product.slug));
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      {/* The portal renders under <body>, outside the storefront layout, so the theme tokens are re-applied on the content. */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          data-theme="storefront"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus.current?.focus();
          }}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-xl border border-border bg-background p-5 text-foreground shadow-xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(28rem,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg"
        >
          <Dialog.Title className="sr-only">{data.title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Seçenekleri belirleyip sepete ekleyin
          </Dialog.Description>
          <Dialog.Close aria-label="Kapat" className="absolute right-3 top-3 rounded-md p-1">
            <X aria-hidden className="size-5" />
          </Dialog.Close>
          <VariantPickerContent product={data} onClose={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function VariantPickerContent({
  product,
  onClose,
}: {
  product: ProductDetail;
  onClose: () => void;
}) {
  const pick = useVariantPick(product);
  const { variant } = pick;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 pr-8">
        <ProductImage
          image={pick.photos[0] ?? product.image}
          sizes="6rem"
          className="w-24 shrink-0 self-start rounded-md"
          eager
        />
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold">{product.title}</h2>
          <Price
            price={product.price}
            oldPrice={product.old_price}
            shelfPrice={product.shelf_price}
            campaignPercentage={product.campaign_percentage}
          />
          <p className="text-sm text-muted-foreground">KDV dahil</p>
        </div>
      </div>
      <ColourChips colours={product.colours} colourId={pick.colourId} onSelect={pick.setColourId} />
      <SizeChips sizes={pick.sizes} size={pick.size} onSelect={pick.setSize} />
      <SizePickerExtras product={product} />
      <div className="space-y-2">
        <p aria-live="polite" className="min-h-6 font-medium text-primary">
          {pick.label}
        </p>
        <div className="flex items-stretch gap-2">
          <QuantityStepper quantity={pick.quantity} onChange={pick.setQuantity} />
          <Button
            size="lg"
            className="h-12 min-w-0 flex-1"
            disabled={!pick.canAdd || pick.pending}
            onClick={() => variant && pick.addVariant(variant.id, onClose)}
          >
            {addLabel(variant, pick.needsSize)}
          </Button>
        </div>
        {variant && !variant.in_stock && (
          <NotifyMe productSlug={product.slug} variantId={variant.id} />
        )}
      </div>
      {product.is_hygiene && <HygieneNotice />}
      <Link
        to="/urun/$slug"
        params={{ slug: product.slug }}
        onClick={onClose}
        className="block text-sm underline underline-offset-4"
      >
        Ürün detayları
      </Link>
    </div>
  );
}
