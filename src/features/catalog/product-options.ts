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
