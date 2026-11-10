import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/account/components/auth-card";
import { VerifyEmail } from "@/features/account/components/verify-email";

export const Route = createFileRoute("/_storefront/hesap/eposta-dogrula/$key")({
  head: () => ({
    meta: [
      { title: "E-posta doğrulama | Aura Tekstil" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: function VerifyRoute() {
    const { key } = Route.useParams();
    return (
      <AuthCard title="E-posta doğrulama">
        <VerifyEmail verifyKey={key} />
      </AuthCard>
    );
  },
});
