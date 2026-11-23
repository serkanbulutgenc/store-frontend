import {
  absoluteUrl,
  breadcrumbJsonLd,
  type HeadResult,
  jsonLdScript,
  largestUrl,
  metaDescription,
  openGraph,
  STORE_NAME,
} from "@/features/catalog/seo";
import type { CampaignPage } from "./queries";

export function campaignListHead(origin: string): HeadResult {
  const title = `Kampanyalar | ${STORE_NAME}`;
  const description = `${STORE_NAME} kampanyaları: güncel fırsatları ve indirimleri keşfedin.`;
  const url = absoluteUrl(origin, "/kampanyalar");
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...openGraph({ title, description, url, type: "website" }),
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      jsonLdScript(breadcrumbJsonLd([{ name: "Kampanyalar", path: "/kampanyalar" }], origin)),
    ],
  };
}

/** An ended page stays reachable but leaves the index. */
export function campaignPageHead(page: CampaignPage, origin: string): HeadResult {
  const title = `${page.title} | ${STORE_NAME}`;
  const description = metaDescription(
    page.description,
    `${page.title} - ${STORE_NAME} kampanyasını inceleyin.`,
  );
  const path = `/kampanyalar/${page.slug}`;
  const url = absoluteUrl(origin, path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(page.ended ? [{ name: "robots", content: "noindex, follow" }] : []),
      ...openGraph({
        title,
        description,
        url,
        type: "website",
        image: page.image ? largestUrl(page.image, origin) : undefined,
      }),
    ],
    links: page.ended ? [] : [{ rel: "canonical", href: url }],
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd(
          [
            { name: "Kampanyalar", path: "/kampanyalar" },
            { name: page.title, path },
          ],
          origin,
        ),
      ),
    ],
  };
}
