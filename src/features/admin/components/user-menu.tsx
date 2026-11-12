import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Me } from "@/lib/api/me";

function initials(me: Me): string {
  const source = (me.name || me.email).trim();
  const parts = source.split(/\s+/);
  const letters = parts.length > 1 ? `${parts[0]?.[0]}${parts[1]?.[0]}` : source.slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR");
}

/** Name and role at the foot of the sidebar; opens Security and sign-out. */
export function UserMenu({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" aria-label="Kullanıcı menüsü">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                  {initials(me)}
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{me.name || me.email}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {me.role === "owner" ? "Sahip" : "Personel"}
                  </span>
                </span>
                <ChevronsUpDown aria-hidden className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isMobile ? "top" : "right"}
              align="end"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-48"
            >
              <DropdownMenuItem asChild>
                <Link to="/admin/security" onClick={() => setOpenMobile(false)}>
                  <ShieldCheck aria-hidden /> Güvenlik
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onSignOut}>
                <LogOut aria-hidden /> Çıkış yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
