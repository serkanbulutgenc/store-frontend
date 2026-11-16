import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { accountQuery } from "@/features/account/queries";
import { basketQuery } from "@/features/basket/queries";
import { DesktopHeaderMenu, MobileHeaderMenu } from "@/features/menus/components/header-menu";
import type { MenuNode } from "@/features/menus/menu-link";

function SearchBox() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <search className="w-full max-w-xs">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          if (term) void navigate({ to: "/ara", search: { q: term } });
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Ürün ara
        </label>
        <Input
          id="site-search"
          type="search"
          placeholder="Ürün ara"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 pr-9"
        />
        <button
          type="submit"
          aria-label="Ara"
          className="absolute right-0 top-0 grid size-10 place-items-center text-muted-foreground"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      </form>
    </search>
  );
}

function BasketLink() {
  const { data } = useQuery(basketQuery);
  const count = data?.item_count ?? 0;
  return (
    <Link
      to="/sepet"
      className="relative grid size-10 place-items-center"
      aria-label={count ? `Sepet, ${count} ürün` : "Sepet"}
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function AccountLink() {
  const { data } = useQuery(accountQuery);
  return (
    <Link
      to={data ? "/hesap" : "/hesap/giris"}
      className="grid size-10 place-items-center"
      aria-label={data ? "Hesabım" : "Giriş yap"}
    >
      <User className="size-5" aria-hidden="true" />
    </Link>
  );
}

export function SiteHeader({ items }: { items: MenuNode[] }) {
  return (
    <header className="bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-1">
          <MobileHeaderMenu items={items} />
          <Link to="/" className="text-xl font-semibold text-primary">
            Aura Tekstil
          </Link>
        </div>
        <SearchBox />
        <div className="flex items-center">
          <AccountLink />
          <BasketLink />
        </div>
      </div>
      <DesktopHeaderMenu items={items} />
    </header>
  );
}
