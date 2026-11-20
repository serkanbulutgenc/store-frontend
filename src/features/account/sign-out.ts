import type { QueryClient } from "@tanstack/react-query";
import { logout } from "@/features/admin/auth/allauth";
import { clearViewed } from "@/features/catalog/recently-viewed";

/**
 * Sign out, then drop everything kept for this person so the next visitor never sees it:
 * the cached queries and the device-local Recently viewed list. A failed sign-out throws and
 * leaves both alone, because the Shopper is still signed in.
 */
export async function endSession(queryClient: QueryClient): Promise<void> {
  await logout();
  queryClient.clear();
  clearViewed();
}
