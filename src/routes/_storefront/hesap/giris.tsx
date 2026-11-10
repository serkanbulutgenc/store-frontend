import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AuthCard } from "@/features/account/components/auth-card";
import { LoginForm } from "@/features/account/components/auth-forms";
import { accountQuery } from "@/features/account/queries";
import { safeRedirect } from "@/features/account/redirect";

export const Route = createFileRoute("/_storefront/hesap/giris")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: async ({ context, search }) => {
    if (await context.queryClient.query(accountQuery))
      throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({
    meta: [{ title: "Giriş | Aura Tekstil" }, { name: "robots", content: "noindex" }],
  }),
  component: function LoginRoute() {
    const { redirect: to } = Route.useSearch();
    return (
      <AuthCard title="Giriş yap">
        <LoginForm redirectTo={safeRedirect(to)} />
      </AuthCard>
    );
  },
});
