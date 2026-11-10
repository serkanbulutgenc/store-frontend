import { createFileRoute, redirect } from "@tanstack/react-router";
import { accountQuery } from "@/features/account/queries";

/** UX guard for the account area; the API answers 401 on its own. */
export const Route = createFileRoute("/_storefront/_customer")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const account = await context.queryClient.query(accountQuery);
    if (!account) throw redirect({ to: "/hesap/giris", search: { redirect: location.href } });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
