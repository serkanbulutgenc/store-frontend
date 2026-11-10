import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/account/components/auth-card";
import { ResetForm } from "@/features/account/components/auth-forms";

export const Route = createFileRoute("/_storefront/hesap/sifre-sifirla/$key")({
  head: () => ({
    meta: [
      { title: "Yeni parola | Aura Tekstil" },
      { name: "robots", content: "noindex" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: function ResetRoute() {
    const { key } = Route.useParams();
    return (
      <AuthCard title="Yeni parola belirle">
        <ResetForm resetKey={key} />
      </AuthCard>
    );
  },
});
