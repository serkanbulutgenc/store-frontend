import { describe, expect, it } from "vitest";
import { renderInStorefront } from "@/features/catalog/components/render-in-storefront";
import type { ProductCard } from "@/features/catalog/queries";
import type { CampaignPage, CampaignPageRow } from "../queries";
import { campaignListHead, campaignPageHead } from "../seo";
import { CampaignList, CampaignPageView, runDates } from "./campaign-pages";

const image = {
  alt: "Yaz fırsatları",
  sizes: [
    { width: 400, url: "/media/kapak-400.webp" },
    { width: 800, url: "/media/kapak-800.webp" },
  ],
};

const row = (over: Partial<CampaignPageRow> = {}): CampaignPageRow => ({
  title: "Yaz fırsatları",
  slug: "yaz-firsatlari",
  image,
  starts_at: "2026-06-01T09:00:00+03:00",
  ends_at: "2026-06-30T21:00:00+03:00",
  ...over,
});

const product: ProductCard = {
  id: 1,
  slug: "havlu",
  title: "Banyo havlusu",
  price: "80.00",
  old_price: null,
  shelf_price: "100.00",
  campaign_percentage: "20.00",
  rating_average: null,
  rating_count: 0,
  sold_out: false,
  colours: [],
  image: null,
};

const page = (over: Partial<CampaignPage> = {}): CampaignPage => ({
  title: "Yaz fırsatları",
  slug: "yaz-firsatlari",
  description: "**Sezon** sonu fırsatları",
  image,
  starts_at: null,
  ends_at: null,
  ended: false,
  campaign: null,
  items: [],
  ...over,
});

describe("runDates", () => {
  it("shows a range, an end or a start, or nothing", () => {
    expect(runDates("2026-06-01T09:00:00+03:00", "2026-06-30T21:00:00+03:00")).toBe(
      "01.06.2026 - 30.06.2026",
    );
    expect(runDates(null, "2026-06-30T21:00:00+03:00")).toBe("30.06.2026 tarihine kadar");
    expect(runDates("2026-06-01T09:00:00+03:00", null)).toBe("01.06.2026 tarihinden itibaren");
    expect(runDates(null, null)).toBeNull();
  });
});

describe("CampaignList", () => {
  it("links each card to its page, with the cover's alt text and the dates", () => {
    const out = renderInStorefront(<CampaignList pages={[row()]} />);

    expect(out).toContain('href="/kampanyalar/yaz-firsatlari"');
    expect(out).toContain('alt="Yaz fırsatları"');
    expect(out).toContain("01.06.2026 - 30.06.2026");
  });

  it("says so when no Campaign page is running", () => {
    expect(renderInStorefront(<CampaignList pages={[]} />)).toContain(
      "devam eden bir kampanya yok",
    );
  });
});

describe("CampaignPageView", () => {
  it("renders the cover, the markdown and the linked Products", () => {
    const out = renderInStorefront(<CampaignPageView page={page({ items: [product] })} />);

    expect(out).toContain('alt="Yaz fırsatları"');
    expect(out).toContain("<strong>Sezon</strong>");
    expect(out).toContain("Banyo havlusu");
    expect(out).not.toContain("sona erdi");
  });

  it("shows the ended notice on an ended page", () => {
    const out = renderInStorefront(<CampaignPageView page={page({ ended: true })} />);

    expect(out).toContain("Bu kampanya sona erdi.");
  });

  it("follows the linked Campaign's dates over its own", () => {
    const out = renderInStorefront(
      <CampaignPageView
        page={page({
          starts_at: "2026-01-01T00:00:00+03:00",
          campaign: {
            active: true,
            starts_at: "2026-07-01T09:00:00+03:00",
            ends_at: "2026-07-15T21:00:00+03:00",
          },
        })}
      />,
    );

    expect(out).toContain("01.07.2026 - 15.07.2026");
    expect(out).not.toContain("01.01.2026");
  });

  it("never renders raw HTML from the description", () => {
    const out = renderInStorefront(
      <CampaignPageView page={page({ description: "<script>alert(1)</script>Merhaba" })} />,
    );

    expect(out).not.toContain("<script");
  });
});

describe("head", () => {
  it("canonicalises the list and the page", () => {
    expect(campaignListHead("https://x.test").links).toEqual([
      { rel: "canonical", href: "https://x.test/kampanyalar" },
    ]);
    expect(campaignPageHead(page(), "https://x.test").links).toEqual([
      { rel: "canonical", href: "https://x.test/kampanyalar/yaz-firsatlari" },
    ]);
  });

  it("keeps an ended page out of the index", () => {
    const head = campaignPageHead(page({ ended: true }), "https://x.test");

    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, follow" });
    expect(head.links).toEqual([]);
  });

  it("uses the cover as the share image", () => {
    const head = campaignPageHead(page(), "https://x.test");

    expect(head.meta).toContainEqual({
      property: "og:image",
      content: "https://x.test/media/kapak-800.webp",
    });
  });
});
