/** Pure rules of the product page: which photos, sizes and stock label to show. */

export type OptPhoto = { id: number; colour_id: number | null; is_primary: boolean };
export type OptVariant = {
  id: number;
  colour: { id: number };
  size: string;
  available: number;
  in_stock: boolean;
  remaining: number | null;
};

const primaryFirst = <T extends OptPhoto>(photos: T[]) =>
  [...photos].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));

/** Selected colour's photos; shared photos when it has none; everything with no colour. */
export function photosForColour<T extends OptPhoto>(photos: T[], colourId: number | null): T[] {
  if (colourId === null) return primaryFirst(photos);
  const own = photos.filter((p) => p.colour_id === colourId);
  if (own.length) return primaryFirst(own);
  const shared = photos.filter((p) => p.colour_id === null);
  return primaryFirst(shared.length ? shared : photos);
}

export function sizesForColour(variants: OptVariant[], colourId: number | null) {
  return variants
    .filter((v) => v.colour.id === colourId)
    .map((v) => ({ size: v.size, variantId: v.id, inStock: v.in_stock }));
}

export function findVariant<T extends OptVariant>(
  variants: T[],
  colourId: number | null,
  size: string | null,
): T | undefined {
  if (colourId === null || size === null) return undefined;
  return variants.find((v) => v.colour.id === colourId && v.size === size);
}

/** The colour's only variant: a one-size colour needs no size choice. */
export function soleVariant<T extends OptVariant>(
  variants: T[],
  colourId: number | null,
): T | undefined {
  if (colourId === null) return undefined;
  const own = variants.filter((v) => v.colour.id === colourId);
  return own.length === 1 ? own[0] : undefined;
}

/**
 * What the customer has picked for a colour. A one-size colour resolves to its only variant with
 * no size chosen; a size the colour does not have is dropped; `needsSize` is true while sizes
 * exist but none is resolved.
 */
export function resolveSelection<T extends OptVariant>(
  variants: T[],
  colourId: number | null,
  size: string | null,
) {
  const sizes = sizesForColour(variants, colourId);
  const sole = soleVariant(variants, colourId);
  const chosen = sole ? sole.size : sizes.some((s) => s.size === size) ? size : null;
  const variant = sole ?? findVariant(variants, colourId, chosen);
  return { sizes, size: chosen, variant, needsSize: sizes.length > 0 && !variant };
}

export function defaultColourId(variants: OptVariant[]): number | null {
  const pick = variants.find((v) => v.in_stock) ?? variants[0];
  return pick ? pick.colour.id : null;
}

export function canAddToBasket(variant: OptVariant | undefined): boolean {
  return variant?.in_stock === true;
}

export function stockLabel(variant: OptVariant | undefined): string | null {
  if (!variant) return null;
  if (!variant.in_stock) return "Tükendi";
  return variant.remaining !== null ? `Son ${variant.remaining} adet` : null;
}

/** The Variant of a Single-Variant Product, which leaves the customer nothing to choose. */
export function singleVariant<T extends OptVariant>(variants: T[]): T | undefined {
  return variants.length === 1 ? variants[0] : undefined;
}

/** What the add-to-basket button says for the current selection. */
export function addLabel(variant: OptVariant | undefined, needsSize: boolean): string {
  if (variant && !variant.in_stock) return "Tükendi";
  return needsSize ? "Beden seçin" : "Sepete ekle";
}
