import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { breadcrumbs } from "../nav";
import { useCrumbLabels } from "./crumb-labels";

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumbs = breadcrumbs(pathname, useCrumbLabels());
  if (crumbs.length === 0) return null;
  return (
    <Breadcrumb className="min-w-0" aria-label="Konum">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((c, i) => (
          <Fragment key={c.to ?? c.label}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="min-w-0">
              {c.to ? (
                <BreadcrumbLink asChild>
                  <Link to={c.to as "/admin"} className="truncate">
                    {c.label}
                  </Link>
                </BreadcrumbLink>
              ) : i === crumbs.length - 1 ? (
                <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
              ) : (
                <span className="truncate">{c.label}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
