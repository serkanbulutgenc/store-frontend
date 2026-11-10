import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/features/account/components/auth-card";
import { SignUpForm } from "@/features/account/components/auth-forms";

export const Route = createFileRoute("/_storefront/hesap/kayit")({
  head: () => ({
    meta: [{ title: "Hesap oluştur | Aura Tekstil" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AuthCard title="Hesap oluştur">
      <SignUpForm />
    </AuthCard>
  ),
});
