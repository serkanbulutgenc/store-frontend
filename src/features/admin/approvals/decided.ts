import type { QueryClient } from "@tanstack/react-query";
import { bannerKeys } from "../banners/queries";
import { pageKeys } from "../campaign-pages/queries";
import { collectionKeys } from "../collections/queries";
import { homepageKeys } from "../homepage/queries";
import { homeKey } from "../returns/queries";
import { approvalKeys } from "./queries";

/** After a decision: what was approved or rejected is also shown on its own screen, in the nav
 * badge and on the Ana sayfa. */
export async function invalidateDecided(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: approvalKeys.all }),
    qc.invalidateQueries({ queryKey: collectionKeys.all }),
    qc.invalidateQueries({ queryKey: pageKeys.all }),
    qc.invalidateQueries({ queryKey: bannerKeys.all }),
    qc.invalidateQueries({ queryKey: homepageKeys.all }),
    qc.invalidateQueries({ queryKey: ["store", "homepage"] }),
    qc.invalidateQueries({ queryKey: homeKey }),
  ]);
}
