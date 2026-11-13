import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Excerpt } from "@/features/legal/excerpt";
import { legalPagesQuery, legalSearchQuery } from "@/features/legal/queries";

export const Route = createFileRoute("/_storefront/yasal/")({
  validateSearch: z.object({ q: z.string().optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ q: search.q?.trim() ?? "" }),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.query(legalPagesQuery),
      context.queryClient.query(legalSearchQuery(deps.q)),
    ]),
  head: () => ({ meta: [{ title: "Yasal bilgiler | Aura Tekstil" }] }),
  component: function LegalIndex() {
    const { q = "" } = Route.useSearch();
    const navigate = Route.useNavigate();
    const { data: pages } = useSuspenseQuery(legalPagesQuery);
    const { data: hits } = useSuspenseQuery(legalSearchQuery(q.trim()));
    const searching = q.trim().length >= 2;
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Yasal bilgiler</h1>
        <search className="mb-6">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get("q");
              void navigate({ search: { q: typeof value === "string" ? value : undefined } });
            }}
          >
            <Input
              name="q"
              type="search"
              defaultValue={q}
              aria-label="Yasal sayfalarda ara"
              placeholder="Yasal sayfalarda ara"
              className="h-11"
            />
            <Button type="submit" className="h-11">
              Ara
            </Button>
          </form>
        </search>
        {searching ? (
          <section aria-live="polite">
            <h2 className="mb-3 font-medium">“{q.trim()}” için sonuçlar</h2>
            {hits.length === 0 ? (
              <p className="text-muted-foreground">Sonuç bulunamadı.</p>
            ) : (
              <ul className="space-y-4">
                {hits.map((hit) => (
                  <li key={hit.page}>
                    <Link
                      to="/yasal/$slug"
                      params={{ slug: hit.slug }}
                      className="text-primary underline"
                    >
                      {hit.title}
                    </Link>
                    <p className="text-muted-foreground">
                      <Excerpt text={hit.excerpt} />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <ul className="space-y-2">
            {pages.map((p) => (
              <li key={p.page}>
                <Link
                  to="/yasal/$slug"
                  params={{ slug: p.slug }}
                  className="text-primary underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  },
});
