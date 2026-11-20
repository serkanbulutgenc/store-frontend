import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { recentlyViewedQuery } from "../queries";
import { clearViewed, readViewed } from "../recently-viewed";
import { RecentlyViewedRail } from "./recently-viewed-rail";

/**
 * "Son baktıklarınız" for the home and product pages. The list lives in the browser, so the
 * server renders nothing and the rail appears after hydration. Nothing shows without history.
 * Once history is known, a block of the rail's height is held while the cards load, so the
 * content below does not jump.
 */
export function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const [slugs, setSlugs] = useState<string[] | null>(null);
  useEffect(() => setSlugs(readViewed().filter((s) => s !== currentSlug)), [currentSlug]);

  const { data } = useQuery({
    ...recentlyViewedQuery(slugs ?? []),
    enabled: Boolean(slugs?.length),
  });
  if (!slugs?.length) return null;
  if (!data) return <div aria-hidden="true" className="min-h-80" />;
  return (
    <RecentlyViewedRail
      products={data}
      currentSlug={currentSlug}
      onClear={() => {
        clearViewed();
        setSlugs([]);
      }}
    />
  );
}
