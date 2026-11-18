import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { can, type Me } from "@/lib/api/me";
import { usePendingCollectionCount } from "../collections/queries";
import { type NavItem, visibleGroups } from "../nav";

function isActive(pathname: string, to: string): boolean {
  return to === "/admin" ? pathname === "/admin" : pathname === to || pathname.startsWith(`${to}/`);
}

/** Grouped navigation. Groups collapse; the whole sidebar folds to an icon rail. */
export function SidebarNav({ me }: { me: Me }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  const pendingCollections = usePendingCollectionCount(can(me, "manage_collections"));
  return (
    <SidebarContent>
      <nav aria-label="Yönetim" className="flex flex-col gap-2">
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
                    {group.items.map((item) =>
                      item.children && item.children.length > 0 ? (
                        <ParentItem
                          key={item.to}
                          item={item}
                          pathname={pathname}
                          counts={{ pendingCollections }}
                          onNavigate={() => setOpenMobile(false)}
                        />
                      ) : (
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
                      ),
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </nav>
    </SidebarContent>
  );
}

type Counts = { pendingCollections: number | undefined };

/** The count behind an item's badge, when it has one and it is above zero. */
const countOf = (item: NavItem, counts: Counts) =>
  item.badge ? counts[item.badge] || undefined : undefined;

function Count({ n }: { n: number }) {
  return (
    <span
      role="status"
      aria-label={`${n} bekleyen`}
      className="ml-auto rounded-full bg-amber-500 px-1.5 text-xs font-medium text-white group-data-[collapsible=icon]:hidden"
    >
      {n}
    </span>
  );
}

/** An item with sub-items. The item itself still links to its own page; the chevron folds the
 * sub-items away. Folded, it shows the sum of their counts so a waiting approval is never hidden. */
function ParentItem({
  item,
  pathname,
  counts,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  counts: Counts;
  onNavigate: () => void;
}) {
  const children = item.children ?? [];
  const onSub = children.some((c) => isActive(pathname, c.to));
  const [open, setOpen] = useState(true);
  const folded = children.reduce((sum, c) => sum + (countOf(c, counts) ?? 0), 0);
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/sub">
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive(pathname, item.to) && !onSub}
          tooltip={item.label}
        >
          <Link to={item.to as "/admin"} onClick={onNavigate}>
            <item.icon aria-hidden />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {!open && folded > 0 && (
          <SidebarMenuBadge className="right-7 bg-amber-500 text-white">
            <span role="status" aria-label={`${folded} bekleyen`}>
              {folded}
            </span>
          </SidebarMenuBadge>
        )}
        <CollapsibleTrigger asChild>
          <SidebarMenuAction aria-label={`${item.label} alt menüsünü ${open ? "kapat" : "aç"}`}>
            <ChevronRight
              aria-hidden
              className="transition-transform group-data-[state=open]/sub:rotate-90"
            />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => {
              const n = countOf(child, counts);
              return (
                <SidebarMenuSubItem key={child.to}>
                  <SidebarMenuSubButton asChild isActive={isActive(pathname, child.to)}>
                    <Link to={child.to as "/admin"} onClick={onNavigate}>
                      <child.icon aria-hidden />
                      <span>{child.label}</span>
                      {n !== undefined && <Count n={n} />}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
