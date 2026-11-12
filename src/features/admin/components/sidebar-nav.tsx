import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Me } from "@/lib/api/me";
import { visibleGroups } from "../nav";

function isActive(pathname: string, to: string): boolean {
  return to === "/admin" ? pathname === "/admin" : pathname === to || pathname.startsWith(`${to}/`);
}

/** Grouped navigation. Groups collapse; the whole sidebar folds to an icon rail. */
export function SidebarNav({ me }: { me: Me }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarContent>
      {visibleGroups(me).map((group) => (
        <Collapsible key={group.label} defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <group.icon aria-hidden className="mr-1.5 size-3.5" />
                {group.label}
                <ChevronDown
                  aria-hidden
                  className="ml-auto size-3 transition-transform group-data-[state=closed]/collapsible:-rotate-90"
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(pathname, item.to)}
                        tooltip={item.label}
                      >
                        <Link to={item.to as "/admin"} onClick={() => setOpenMobile(false)}>
                          <item.icon aria-hidden />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ))}
    </SidebarContent>
  );
}
