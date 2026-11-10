import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/admin/auth/allauth";

const LINKS = [
  { to: "/hesap", label: "Profil" },
  { to: "/hesap/siparisler", label: "Siparişlerim" },
  { to: "/hesap/adresler", label: "Adreslerim" },
  { to: "/hesap/guvenlik", label: "Güvenlik" },
] as const;

/** Sign out, then drop everything cached for this person so the next visitor never sees it. */
export function useSignOut() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    try {
      await logout();
      qc.clear();
      await router.invalidate();
      await router.navigate({ to: "/" });
    } catch {
      toast.error("Çıkış yapılamadı. Lütfen tekrar deneyin.");
    }
  };
}

export function AccountShell() {
  const signOut = useSignOut();
  return (
    <div className="mx-auto max-w-5xl gap-8 px-4 py-8 md:grid md:grid-cols-[12rem_1fr]">
      <nav aria-label="Hesabım" className="mb-6 md:mb-0">
        <ul className="flex flex-wrap gap-1 md:flex-col">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: true }}
                className="block rounded-md px-3 py-2 hover:bg-accent"
                activeProps={{ className: "bg-accent font-medium", "aria-current": "page" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Button variant="ghost" className="w-full justify-start" onClick={() => void signOut()}>
              Çıkış yap
            </Button>
          </li>
        </ul>
      </nav>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
