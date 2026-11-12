import { Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Me } from "@/lib/api/me";

function initials(me: Me): string {
  const source = (me.name || me.email).trim();
  const parts = source.split(/\s+/);
  const letters = parts.length > 1 ? `${parts[0]?.[0]}${parts[1]?.[0]}` : source.slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR");
}

/** Popover at the foot of the sidebar: name and role, Security, sign out. Esc and outside click close it. */
export function UserMenu({
  me,
  rail,
  onSignOut,
  onNavigate,
}: {
  me: Me;
  rail: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const itemClass = "flex h-8 w-full items-center gap-2 rounded px-2 text-left hover:bg-accent";
  return (
    <div ref={root} className="relative border-t border-border p-2">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Kullanıcı menüsü"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-accent"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
          {initials(me)}
        </span>
        {!rail && (
          <span className="min-w-0 text-left">
            <span className="block truncate font-medium">{me.name || me.email}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {me.role === "owner" ? "Sahip" : "Personel"}
            </span>
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-2 z-50 mb-1 w-48 rounded-md border border-border bg-card p-1 shadow-md"
        >
          <Link
            to="/admin/security"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            <ShieldCheck aria-hidden className="size-4" /> Güvenlik
          </Link>
          <button type="button" role="menuitem" className={itemClass} onClick={onSignOut}>
            <LogOut aria-hidden className="size-4" /> Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
