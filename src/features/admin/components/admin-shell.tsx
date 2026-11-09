import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { Me } from "@/lib/api/me";
import { logout } from "../auth/allauth";
import { visibleNav } from "../nav";

export function AdminShell({ me }: { me: Me }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  async function signOut() {
    await logout();
    queryClient.clear();
    await router.invalidate();
  }
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 border-r border-border bg-card p-2">
        <div className="px-2 py-3 font-semibold">Aura Tekstil</div>
        <nav aria-label="Yönetim" className="flex flex-col gap-0.5">
          {visibleNav(me).map((item) => (
            <Link
              key={item.to}
              to={item.to as "/admin"}
              activeOptions={{ exact: item.to === "/admin" }}
              className="flex h-8 items-center rounded-md px-2 hover:bg-accent data-[status=active]:bg-accent data-[status=active]:font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-end gap-3 border-b border-border bg-card px-4">
          <span className="text-muted-foreground">{me.name || me.email}</span>
          <Button size="sm" variant="outline" onClick={signOut}>
            Çıkış yap
          </Button>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
