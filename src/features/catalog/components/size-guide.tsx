import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { type ProductDetail, sizeGuideQuery } from "../queries";
import { ProductDescription } from "./product-description";

type Extras = Pick<ProductDetail, "slug" | "has_size_guide" | "fit_note">;

/**
 * Under the size picker: the "Beden tablosu" link and the Fit note ("Kalıp notu"). The link
 * only appears when a guide applies (the API says no for a One-size Product), and the guide
 * text itself is loaded when the dialog opens, so it is never part of the page HTML.
 */
export function SizePickerExtras({ product }: { product: Extras }) {
  const [open, setOpen] = useState(false);
  if (!product.has_size_guide && !product.fit_note) return null;
  return (
    <div className="space-y-1 text-sm">
      {product.has_size_guide && (
        <>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Beden tablosu
          </button>
          <SizeGuideDialog slug={product.slug} open={open} onOpenChange={setOpen} />
        </>
      )}
      {product.fit_note && (
        <p>
          <span className="font-medium">Kalıp notu:</span> {product.fit_note}
        </p>
      )}
    </div>
  );
}

/** A bottom sheet on phones, a centred dialog from `md` up. Radix supplies focus trap and Escape. */
function SizeGuideDialog({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content
          data-theme="storefront"
          className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-xl border border-border bg-background p-5 text-foreground shadow-xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(40rem,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg"
        >
          <Dialog.Title className="mb-3 pr-8 text-lg font-semibold">Beden tablosu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Bu ürün için ölçü tablosu ve ölçü alma ipuçları
          </Dialog.Description>
          <Dialog.Close aria-label="Kapat" className="absolute right-3 top-3 rounded-md p-1">
            <X aria-hidden className="size-5" />
          </Dialog.Close>
          <GuideBody slug={slug} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GuideBody({ slug }: { slug: string }) {
  const { data, isError } = useQuery(sizeGuideQuery(slug));
  return <SizeGuideContent text={data?.text} failed={isError} />;
}

/** What the dialog shows: the guide in the Description renderer, or why it is not there yet. */
export function SizeGuideContent({ text, failed }: { text?: string; failed?: boolean }) {
  if (failed)
    return (
      <p role="alert" className="py-6 text-center">
        Beden tablosu yüklenemedi. Lütfen tekrar deneyin.
      </p>
    );
  if (text === undefined)
    return (
      <p role="status" className="py-6 text-center">
        Yükleniyor…
      </p>
    );
  return <ProductDescription source={text} />;
}
