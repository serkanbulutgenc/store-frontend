import { Suspense } from "react";
import { PendingState } from "@/components/route-states";
import type { BrowseSearch } from "../browse-search";
import type { CategoryNode } from "../queries";
import { ProductListing } from "./product-listing";

type Nav = (opts: { search: BrowseSearch; resetScroll: boolean }) => unknown;

/** Shared body of the category and search routes. */
export function ListingRoute({
  title,
  search,
  category,
  categories,
  navigate,
}: {
  title: string;
  search: BrowseSearch;
  category?: string;
  categories: CategoryNode[];
  navigate: Nav;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
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
