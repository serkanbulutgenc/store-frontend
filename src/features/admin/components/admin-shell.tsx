import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Me } from "@/lib/api/me";
import { logout } from "../auth/allauth";
import { Breadcrumbs } from "./breadcrumbs";
import { CrumbLabelsProvider } from "./crumb-labels";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

const STORAGE_KEY = "admin.sidebar.collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mobile slide-in menu on the native <dialog>: focus trap, Esc and backdrop for free. */
function MobileMenu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc closes a modal <dialog> natively; the click is only the backdrop
    <dialog
      ref={ref}
      aria-label="Menü"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/40 md:hidden"
    >
      {open && (
        <aside className="flex h-full w-64 flex-col bg-card text-foreground">{children}</aside>
      )}
    </dialog>
  );
}

export function AdminShell({ me }: { me: Me }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the menu on every navigation
  useEffect(() => setMobileOpen(false), [pathname]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Private mode: the choice just does not persist.
    }
  }
  async function signOut() {
    await logout();
    queryClient.clear();
    await router.invalidate();
  }

  return (
    <CrumbLabelsProvider>
      <div className="flex min-h-screen">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card md:flex ${
            collapsed ? "w-14" : "w-60"
          }`}
        >
          <div className="flex h-12 items-center justify-between border-b border-border px-3">
            {!collapsed && <span className="truncate font-semibold">Aura Tekstil</span>}
            <button
              type="button"
              aria-label={collapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"}
              aria-expanded={!collapsed}
              onClick={toggle}
              className={`rounded p-1 hover:bg-accent ${collapsed ? "mx-auto" : ""}`}
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden className="size-4" />
              ) : (
                <PanelLeftClose aria-hidden className="size-4" />
              )}
            </button>
          </div>
          <SidebarNav me={me} rail={collapsed} />
          <UserMenu me={me} rail={collapsed} onSignOut={signOut} />
        </aside>

        <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
          <div className="flex h-12 items-center justify-between border-b border-border px-3">
            <span className="font-semibold">Aura Tekstil</span>
            <button
              type="button"
              aria-label="Menüyü kapat"
              className="rounded p-1 hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          <SidebarNav me={me} rail={false} onNavigate={() => setMobileOpen(false)} />
          <UserMenu
            me={me}
            rail={false}
            onSignOut={signOut}
            onNavigate={() => setMobileOpen(false)}
          />
        </MobileMenu>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-3">
            <button
              type="button"
              aria-label="Menüyü aç"
              className="rounded p-1 hover:bg-accent md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu aria-hidden className="size-4" />
            </button>
            <Breadcrumbs />
          </header>
          <main className="min-w-0 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </CrumbLabelsProvider>
  );
}
