import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "@/features/admin/auth/login-form";

export const Route = createFileRoute("/admin/login")({
  validateSearch: z.object({
    redirect: z.string().startsWith("/admin").optional().catch(undefined),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.me) throw redirect({ href: search.redirect ?? "/admin" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: to } = Route.useSearch();
  return (
    <main className="mx-auto mt-24 w-full max-w-sm rounded-md border border-border bg-card p-6">
      <h1 className="mb-4 text-lg font-semibold">Yönetim paneli girişi</h1>
      <LoginForm redirectTo={to ?? "/admin"} />
    </main>
  );
}
