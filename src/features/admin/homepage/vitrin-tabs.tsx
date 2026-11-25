import { Link } from "@tanstack/react-router";
import { can, type Me } from "@/lib/api/me";
import { cn } from "@/lib/utils";

export type VitrinTab = "layout" | "announcement" | "category_top";

/** What the Vitrin area holds: the page layout, the announcement bar above the header and the
 * pictures on top of the Category pages. A tab shows only for those who may use it. */
export function vitrinTabs(me: Me): { key: VitrinTab; label: string }[] {
  return [
    ...(can(me, "edit_homepage") ? [{ key: "layout" as const, label: "Düzen" }] : []),
    ...(can(me, "edit_banners")
      ? [
          { key: "announcement" as const, label: "Duyuru çubuğu" },
          { key: "category_top" as const, label: "Kategori sayfası üstü" },
        ]
      : []),
  ];
}

export function VitrinTabs({ me, active }: { me: Me; active: VitrinTab | null }) {
  const tabs = vitrinTabs(me);
  if (tabs.length < 2) return null;
  return (
    <nav aria-label="Vitrin bölümleri" className="flex gap-1 border-b">
      {tabs.map((t) => (
        <Link
          key={t.key}
          {...(t.key === "layout"
            ? { to: "/admin/homepage" as const }
            : { to: "/admin/banners" as const, search: { slot: t.key } })}
          aria-current={t.key === active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
            t.key === active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
