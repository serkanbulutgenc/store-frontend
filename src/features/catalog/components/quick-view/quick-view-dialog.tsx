import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { descriptionExcerpt } from "../../description-excerpt";
import { type ProductDetail, productQuery } from "../../queries";
import { BrandLogo } from "../brand-logo";
import { Price } from "../product-card";
import { ProductGallery } from "../product-gallery";
import { SizePickerExtras } from "../size-guide";
import { ColourChips, SizeChips } from "./option-chips";
import { useQuickPick } from "./use-quick-pick";

// Characters of the Description kept for the 4-line preview.
const EXCERPT_LENGTH = 300;

export function QuickViewDialog({
  slug,
  title,
  open,
  onOpenChange,
}: {
  slug: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {/* The portal renders under <body>, outside the storefront layout, so the theme tokens are re-applied on the content. */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          data-theme="storefront"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-background p-5 text-foreground shadow-xl"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">Hızlı ürün önizlemesi</Dialog.Description>
          <Dialog.Close aria-label="Kapat" className="absolute right-3 top-3 rounded-md p-1">
            <X className="size-5" />
          </Dialog.Close>
          <Body slug={slug} onAdded={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Body({ slug, onAdded }: { slug: string; onAdded: () => void }) {
  const { data, isError } = useQuery(productQuery(slug));
  if (isError)
    return (
      <p role="alert" className="p-10 text-center">
        Ürün yüklenemedi. Lütfen tekrar deneyin.
      </p>
    );
  if (!data)
    return (
      <p role="status" className="p-10 text-center">
        Yükleniyor…
      </p>
    );
  return <Content product={data} onAdded={onAdded} />;
}

function Content({ product, onAdded }: { product: ProductDetail; onAdded: () => void }) {
  const pick = useQuickPick(product);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProductGallery
        key={pick.colourId}
        photos={pick.photos}
        fallback={product.image}
        sizes="(min-width: 768px) 28rem, 100vw"
      />
      <div className="space-y-4">
        <div>
          {product.brand && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <BrandLogo url={product.brand.logo_url} />
              {product.brand.name}
            </p>
          )}
          <h2 className="text-xl font-semibold">{product.title}</h2>
        </div>
        <div>
          <Price
            price={product.price}
            oldPrice={product.old_price}
            shelfPrice={product.shelf_price}
            campaignPercentage={product.campaign_percentage}
          />
          <p className="text-sm text-muted-foreground">KDV dahil</p>
        </div>
        <ColourChips product={product} pick={pick} />
        <SizeChips pick={pick} />
        <SizePickerExtras product={product} />
        <p aria-live="polite" className="min-h-5 text-sm font-medium text-primary">
          {pick.label}
        </p>
        <Button
          size="lg"
          className="w-full"
          disabled={!pick.canAdd || pick.pending}
          onClick={() => pick.variant && pick.addVariant(pick.variant.id, onAdded)}
        >
          {pick.variant && !pick.variant.in_stock
            ? "Tükendi"
            : pick.needsSize
              ? "Beden seçin"
              : "Sepete ekle"}
        </Button>
        {product.description && (
          <p className="line-clamp-4 text-sm text-muted-foreground">
            {descriptionExcerpt(product.description, EXCERPT_LENGTH)}
          </p>
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
