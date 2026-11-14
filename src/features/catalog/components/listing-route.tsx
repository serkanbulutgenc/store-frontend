import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowseSearch } from "../browse-search";
import type { CardImage, CategoryNode, SeedPages } from "../queries";
import { ProductImage } from "./product-image";
import { ListingSkeleton, ProductListing } from "./product-listing";

type Nav = (opts: { search: BrowseSearch; resetScroll: boolean; replace?: boolean }) => unknown;

/** Shared body of the category and search routes. */
export function ListingRoute({
  title,
  search,
  category,
  categories,
  seed,
  navigate,
  intro,
}: {
  title: string;
  search: BrowseSearch;
  category?: string;
  categories: CategoryNode[];
  /** Pages the server loaded, for a hydration that matches its HTML. */
  seed: SeedPages | null;
  navigate: Nav;
  /** A Category page's copy and image, shown above the products. */
  intro?: { description: string; image: CardImage | null };
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      {intro?.image && (
        <ProductImage
          image={intro.image}
          sizes="(min-width: 1152px) 1152px, 100vw"
          eager
          className="mb-4 aspect-[16/6] rounded-md"
        />
      )}
      {intro?.description && (
        <p className="mb-6 max-w-3xl whitespace-pre-line text-muted-foreground">
          {intro.description}
        </p>
      )}
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing
          search={search}
          category={category}
          categories={categories}
          seed={seed}
          onSearchChange={(next, opts) =>
            void navigate({ search: next, resetScroll: !opts?.keepScroll, replace: opts?.replace })
          }
        />
      </Suspense>
    </main>
  );
}

/** Route `pendingComponent` for the listing routes: the same skeleton the listing itself uses. */
export function ListingPending() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Skeleton className="mb-4 h-8 w-56" />
      <ListingSkeleton />
    </main>
  );
}
