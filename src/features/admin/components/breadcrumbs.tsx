import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { breadcrumbs } from "../nav";
import { useCrumbLabels } from "./crumb-labels";

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = breadcrumbs(pathname, useCrumbLabels());
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Konum" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.to ?? c.label} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden className="size-3 shrink-0" />}
              {c.to ? (
                <Link
                  to={c.to as "/admin"}
                  className="truncate hover:text-foreground hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={last ? "truncate font-medium text-foreground" : "truncate"}
                  aria-current={last ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
