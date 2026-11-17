import type { CollectionPage as Collection } from "../queries";
import { ProductGrid } from "./product-card";

/** A published Collection: its copy and Products in the Owner's order. Sold-out Products
 * stay and are dimmed; the server leaves out draft and archived ones. */
export function CollectionView({ collection }: { collection: Collection }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{collection.name}</h1>
      {collection.description && (
        <p className="mb-6 max-w-3xl whitespace-pre-line text-muted-foreground">
          {collection.description}
        </p>
      )}
      <ProductGrid products={collection.items} dimSoldOut />
    </main>
  );
}
