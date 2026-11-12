import { useQueryClient } from "@tanstack/react-query";
import { Outlet, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { Me } from "@/lib/api/me";
import { logout } from "../auth/allauth";
import { Breadcrumbs } from "./breadcrumbs";
import { CrumbLabelsProvider } from "./crumb-labels";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

const STORAGE_KEY = "admin.sidebar.collapsed";

function readOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

export function AdminShell({ me }: { me: Me }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(readOpen);

  function onOpenChange(next: boolean) {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "0" : "1");
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
      <SidebarProvider open={open} onOpenChange={onOpenChange}>
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-12 justify-center border-b border-sidebar-border">
            <span className="truncate px-2 font-semibold group-data-[collapsible=icon]:hidden">
              Aura Tekstil
            </span>
          </SidebarHeader>
          <SidebarNav me={me} />
          <UserMenu me={me} onSignOut={signOut} />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-3">
            <SidebarTrigger aria-label="Kenar çubuğunu aç veya kapat" />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Breadcrumbs />
          </header>
          <main className="min-w-0 p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </CrumbLabelsProvider>
  );
}
