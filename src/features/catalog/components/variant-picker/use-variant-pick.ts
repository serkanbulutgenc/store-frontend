import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAddToBasket } from "@/features/basket/queries";
import {
  canAddToBasket,
  defaultColourId,
  photosForColour,
  resolveSelection,
  stockLabel,
} from "../../product-options";
import type { ProductDetail } from "../../queries";

/** Add to the basket and say so, or say why it failed. */
export function useAddWithToast() {
  const add = useAddToBasket();
  const navigate = useNavigate();

  function addVariant(variantId: number, quantity: number, onAdded?: () => void) {
    add.mutate(
      { variantId, quantity },
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

  return { pending: add.isPending, addVariant };
}

/** Colour, size and quantity selection for one product, plus adding the picked variant. */
export function useVariantPick(product: ProductDetail) {
  const [colourId, setColourId] = useState(() => defaultColourId(product.variants));
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const add = useAddWithToast();

  const {
    sizes,
    size: activeSize,
    variant,
    needsSize,
  } = resolveSelection(product.variants, colourId, size);

  return {
    colourId,
    setColourId,
    size: activeSize,
    setSize,
    sizes,
    needsSize,
    variant,
    label: stockLabel(variant),
    canAdd: canAddToBasket(variant),
    photos: photosForColour(product.photos, colourId),
    quantity,
    setQuantity,
    pending: add.pending,
    addVariant: (variantId: number, onAdded?: () => void) =>
      add.addVariant(variantId, quantity, onAdded),
  };
}
