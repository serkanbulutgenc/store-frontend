/** "Kumaş" in two classes of one listing would read the same: add the class then. */
export function facetLabels<T extends { id: number; name: string; product_class: string }>(
  facets: T[],
): Map<number, string> {
  const seen = new Map<string, number>();
  for (const f of facets) seen.set(f.name, (seen.get(f.name) ?? 0) + 1);
  return new Map(
    facets.map((f) => [
      f.id,
      (seen.get(f.name) ?? 0) > 1 ? `${f.name} (${f.product_class})` : f.name,
    ]),
  );
}
