import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Me } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { visibleGroups } from "../nav";

/** Grouped navigation. `rail` shows icons only (collapsed desktop sidebar). */
export function SidebarNav({
  me,
  rail,
  onNavigate,
}: {
  me: Me;
  rail: boolean;
  onNavigate?: () => void;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <nav aria-label="Yönetim" className="flex-1 overflow-y-auto py-2">
      {visibleGroups(me).map((group, index) => {
        const isClosed = !rail && closed[group.label];
        return (
          <div key={group.label} className="mb-2">
            {rail ? (
              index > 0 && <div className="mx-3 my-2 border-t border-border" />
            ) : (
              <button
                type="button"
                aria-expanded={!isClosed}
                onClick={() => setClosed({ ...closed, [group.label]: !closed[group.label] })}
                className="flex w-full items-center justify-between px-4 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <group.icon aria-hidden className="size-3.5" />
                  {group.label}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn("size-3 transition-transform", isClosed && "-rotate-90")}
                />
              </button>
            )}
            {!isClosed &&
              group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as "/admin"}
                  activeOptions={{ exact: item.to === "/admin" }}
                  title={rail ? item.label : undefined}
                  aria-label={rail ? item.label : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "mx-2 flex h-8 items-center rounded-md px-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring data-[status=active]:bg-accent data-[status=active]:font-medium",
                    rail && "justify-center",
                  )}
                >
                  <item.icon aria-hidden className={cn("size-4 shrink-0", !rail && "mr-2")} />
                  {!rail && <span className="truncate">{item.label}</span>}
                </Link>
              ))}
          </div>
        );
      })}
    </nav>
  );
}
