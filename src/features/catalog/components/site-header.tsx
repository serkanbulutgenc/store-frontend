import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, User } from "lucide-react";
import { accountQuery } from "@/features/account/queries";
import { basketQuery } from "@/features/basket/queries";
import { SearchBox } from "@/features/catalog/components/search-box";
import { DesktopHeaderMenu, MobileHeaderMenu } from "@/features/menus/components/header-menu";
import type { MenuNode } from "@/features/menus/menu-link";

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
