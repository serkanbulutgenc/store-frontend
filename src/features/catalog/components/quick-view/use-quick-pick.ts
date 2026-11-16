import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAddToBasket } from "@/features/basket/queries";
import {
  canAddToBasket,
  defaultColourId,
  findVariant,
  photosForColour,
  sizesForColour,
  stockLabel,
} from "../../product-options";
import type { ProductDetail } from "../../queries";

/** Colour and size selection for one product, plus adding the picked variant to the basket. */
export function useQuickPick(product: ProductDetail) {
  const [colourId, setColourId] = useState(() => defaultColourId(product.variants));
  const [size, setSize] = useState<string | null>(null);
  const add = useAddToBasket();
  const navigate = useNavigate();

  const sizes = sizesForColour(product.variants, colourId);
  // A size that does not exist in the newly picked colour is dropped.
  const activeSize = sizes.some((s) => s.size === size) ? size : null;
  const variant = findVariant(product.variants, colourId, activeSize);

  function addVariant(variantId: number, onAdded?: () => void) {
    add.mutate(
      { variantId },
      {
        onSuccess: () => {
          toast.success("Ürün sepete eklendi.", {
            action: { label: "Sepete git", onClick: () => void navigate({ to: "/sepet" }) },
          });
          onAdded?.();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return {
    colourId,
    setColourId,
    size: activeSize,
    setSize,
    sizes,
    variant,
    label: stockLabel(variant),
    canAdd: canAddToBasket(variant),
    photos: photosForColour(product.photos, colourId),
    pending: add.isPending,
    addVariant,
  };
}

export type QuickPick = ReturnType<typeof useQuickPick>;
