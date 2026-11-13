import { createFileRoute, redirect } from "@tanstack/react-router";
import { accountQuery } from "@/features/account/queries";
import { fetchMe } from "@/lib/api/fetch-me";

/**
 * UX guard for the account area; the API answers 401 on its own. A Dashboard user has no
 * Storefront account (the API refuses them), so they go to the Dashboard instead.
 */
export const Route = createFileRoute("/_storefront/_customer")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const account = await context.queryClient.query(accountQuery);
    if (account) return;
    if (await fetchMe()) throw redirect({ href: "/admin" });
    throw redirect({ to: "/hesap/giris", search: { redirect: location.href } });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
