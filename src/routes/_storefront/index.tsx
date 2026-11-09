import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { categoriesQuery, productsPageQuery } from "@/features/catalog/queries";
import { homeHead } from "@/features/catalog/seo";

const NEW_ARRIVALS = 8;

export const Route = createFileRoute("/_storefront/")({
  loader: async ({ context }) => {
    const [page, categories] = await Promise.all([
      context.queryClient.query(productsPageQuery({}, { page: 1 })),
      context.queryClient.query(categoriesQuery),
    ]);
    return { arrivals: page.items.slice(0, NEW_ARRIVALS), categories };
  },
  head: ({ match }) => homeHead(match.context.siteOrigin),
  component: function Home() {
    const { arrivals, categories } = Route.useLoaderData();
    return (
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        {/* The optional banner is a Store setting (ticket 20); it slots in here. */}
        <section aria-labelledby="new">
          <h1 id="new" className="mb-4 text-2xl font-semibold">
            Yeni gelenler
          </h1>
          {arrivals.length > 0 ? (
            <ProductGrid products={arrivals} />
          ) : (
            <p className="text-muted-foreground">Ürünler yakında burada.</p>
          )}
        </section>
        {categories.length > 0 && (
          <section aria-labelledby="cats">
            <h2 id="cats" className="mb-4 text-xl font-semibold">
              Kategoriler
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/kategori/$slug"
                    params={{ slug: c.slug }}
                    className="grid h-28 place-items-center rounded-md border border-border bg-card text-lg hover:bg-accent"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    );
  },
});
