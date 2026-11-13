import { Suspense } from "react";
import { PendingState } from "@/components/route-states";
import type { BrowseSearch } from "../browse-search";
import type { CardImage, CategoryNode } from "../queries";
import { ProductImage } from "./product-image";
import { ProductListing } from "./product-listing";

type Nav = (opts: { search: BrowseSearch; resetScroll: boolean }) => unknown;

/** Shared body of the category and search routes. */
export function ListingRoute({
  title,
  search,
  category,
  categories,
  navigate,
  intro,
}: {
  title: string;
  search: BrowseSearch;
  category?: string;
  categories: CategoryNode[];
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
      <Suspense fallback={<PendingState />}>
        <ProductListing
          search={search}
          category={category}
          categories={categories}
          onSearchChange={(next, opts) =>
            void navigate({ search: next, resetScroll: !opts?.keepScroll })
          }
        />
      </Suspense>
    </main>
  );
}
