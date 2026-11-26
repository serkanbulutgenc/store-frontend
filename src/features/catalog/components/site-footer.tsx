import { FooterMenu } from "@/features/menus/components/footer-menu";
import type { MenuNode } from "@/features/menus/menu-link";

export function SiteFooter({ items }: { items: MenuNode[] }) {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <nav aria-label="Yasal bilgiler" className="mx-auto max-w-6xl px-4 py-6">
        <FooterMenu items={items} />
        <p className="mt-4 text-muted-foreground">© Auraa Giyim</p>
      </nav>
    </footer>
  );
}
