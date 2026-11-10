import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/account/components/auth-card";
import { ResetRequestForm } from "@/features/account/components/auth-forms";

export const Route = createFileRoute("/_storefront/hesap/sifre-sifirla/")({
  head: () => ({
    meta: [{ title: "Şifre sıfırlama | Aura Tekstil" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AuthCard title="Şifremi unuttum">
      <ResetRequestForm />
    </AuthCard>
  ),
});
