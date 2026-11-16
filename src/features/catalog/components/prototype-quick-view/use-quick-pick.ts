// PROTOTYPE: shared selection + add logic. Reuses the real product-options rules and basket mutation.
import { useQuery } from "@tanstack/react-query";
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
import { type ProductDetail, productQuery } from "../../queries";

export function useQuickProduct(slug: string, enabled: boolean) {
  return useQuery({ ...productQuery(slug), enabled });
}

export function useQuickPick(product: ProductDetail) {
  const [colourId, setColourId] = useState(() => defaultColourId(product.variants));
  const [size, setSize] = useState<string | null>(null);
  const sizes = sizesForColour(product.variants, colourId);
  const activeSize = sizes.some((s) => s.size === size) ? size : null;
  const variant = findVariant(product.variants, colourId, activeSize);
  const add = useAddToBasket();
  const navigate = useNavigate();

  function addVariant(variantId: number, onDone?: () => void) {
    add.mutate(
      { variantId },
      {
        onSuccess: () => {
          toast.success("Ürün sepete eklendi.", {
            action: { label: "Sepete git", onClick: () => void navigate({ to: "/sepet" }) },
          });
          onDone?.();
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
    addable: canAddToBasket(variant),
    colour: product.colours.find((c) => c.id === colourId),
    photos: photosForColour(product.photos, colourId),
    pending: add.isPending,
    addVariant,
    /** Add the currently picked size. */
    addPicked: (onDone?: () => void) => variant && addVariant(variant.id, onDone),
  };
}

export type QuickPick = ReturnType<typeof useQuickPick>;
