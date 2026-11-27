import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { accountQuery } from "@/features/account/queries";
import { basketQuery } from "@/features/basket/queries";
import { DesktopHeaderMenu, MobileHeaderMenu } from "@/features/menus/components/header-menu";
import type { MenuNode } from "@/features/menus/menu-link";

function SearchBox() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <search className="w-full">
      <form
        className="flex w-full"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          if (term) void navigate({ to: "/ara", search: { q: term } });
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Ürün ara
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="site-search"
            type="search"
            placeholder="Elbise, ayakkabı, çanta ara"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 rounded-r-none border-foreground/60 pl-10"
          />
        </div>
        <Button type="submit" size="lg" className="rounded-l-none px-5">
          Ara
        </Button>
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
        <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-sm bg-primary px-1 text-xs text-primary-foreground">
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
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 lg:grid-cols-[auto_minmax(0,40rem)_auto] lg:justify-between">
        <div className="flex items-center gap-1">
          <MobileHeaderMenu items={items} />
          <Link to="/" className="inline-flex items-center">
            <img
              src="/auraa-logo.svg"
              alt="Auraa Giyim"
              width={128}
              height={68}
              className="h-14 w-auto"
            />
          </Link>
        </div>
        <div className="order-last col-span-3 lg:order-none lg:col-span-1">
          <SearchBox />
        </div>
        <div className="col-start-3 row-start-1 flex items-center lg:col-start-auto lg:row-start-auto">
          <AccountLink />
          <BasketLink />
        </div>
      </div>
      <DesktopHeaderMenu items={items} />
    </header>
  );
}
