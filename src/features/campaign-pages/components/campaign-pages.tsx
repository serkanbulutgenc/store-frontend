import { Link } from "@tanstack/react-router";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { ProductDescription } from "@/features/catalog/components/product-description";
import { ProductImage } from "@/features/catalog/components/product-image";
import { formatDate } from "@/lib/format";
import type { CampaignPage, CampaignPageRow } from "../queries";

/** "23.11.2026 10:00" as a day only: Campaign pages run on dates, not minutes. */
const day = (iso: string) => formatDate(iso).split(" ")[0];

/** The dates a page runs, or nothing when it has neither. */
export function runDates(startsAt: string | null, endsAt: string | null): string | null {
  if (startsAt && endsAt) return `${day(startsAt)} - ${day(endsAt)}`;
  if (endsAt) return `${day(endsAt)} tarihine kadar`;
  if (startsAt) return `${day(startsAt)} tarihinden itibaren`;
  return null;
}

/** `/kampanyalar`: cover cards, newest first. The API already leaves out ended pages. */
export function CampaignList({ pages }: { pages: CampaignPageRow[] }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Kampanyalar</h1>
      {pages.length === 0 ? (
        <p className="text-muted-foreground">Şu anda devam eden bir kampanya yok.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => {
            const dates = runDates(page.starts_at, page.ends_at);
            return (
              <li key={page.slug}>
                <Link
                  to="/kampanyalar/$slug"
                  params={{ slug: page.slug }}
                  className="group block overflow-hidden rounded-md border"
                >
                  <ProductImage
                    image={page.image}
                    sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[16/9] transition group-hover:opacity-90"
                  />
                  <div className="p-3">
                    <h2 className="font-semibold group-hover:underline">{page.title}</h2>
                    {dates && <p className="text-sm text-muted-foreground">{dates}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

/** `/kampanyalar/<slug>`: cover, copy, the linked Campaign's Products and an "ended" notice. */
export function CampaignPageView({ page }: { page: CampaignPage }) {
  // A linked page follows its Campaign's own schedule; an unlinked one runs on its own dates.
  const dates = page.campaign
    ? runDates(page.campaign.starts_at, page.campaign.ends_at)
    : runDates(page.starts_at, page.ends_at);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold">{page.title}</h1>
      {dates && <p className="mb-4 text-sm text-muted-foreground">{dates}</p>}
      {page.ended && (
        <p role="status" className="mb-4 rounded-md bg-muted px-3 py-2 font-medium">
          Bu kampanya sona erdi.
        </p>
      )}
      {page.image && (
        <ProductImage
          image={page.image}
          sizes="(min-width: 1152px) 1152px, 100vw"
          eager
          className="mb-4 aspect-[16/6] rounded-md"
        />
      )}
      {page.description && (
        <div className="mb-6">
          <ProductDescription source={page.description} />
        </div>
      )}
      {page.items.length > 0 && <ProductGrid products={page.items} dimSoldOut />}
    </main>
  );
}
