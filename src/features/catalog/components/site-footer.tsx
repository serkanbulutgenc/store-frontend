import { Link } from "@tanstack/react-router";
import { LEGAL_PAGES } from "@/features/legal/pages";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <nav aria-label="Yasal bilgiler" className="mx-auto max-w-6xl px-4 py-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_PAGES.map((p) => (
            <li key={p.slug}>
              <Link
                to="/yasal/$slug"
                params={{ slug: p.slug }}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {p.title}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/siparis-takip"
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Sipariş takibi
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-muted-foreground">© Aura Tekstil</p>
      </nav>
    </footer>
  );
}
