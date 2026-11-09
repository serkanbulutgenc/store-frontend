import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { CategoryNode } from "../queries";

/** Top-level categories; hovering or focusing one opens its children. */
function CategoryMenu({ categories }: { categories: CategoryNode[] }) {
  return (
    <nav aria-label="Kategoriler" className="border-t border-border">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {categories.map((c) => (
          <li key={c.slug} className="group relative shrink-0">
            <Link
              to="/kategori/$slug"
              params={{ slug: c.slug }}
              className="block px-3 py-3 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              {c.name}
            </Link>
            {c.children.length > 0 && (
              <ul className="invisible absolute left-0 top-full z-20 min-w-48 rounded-md border border-border bg-card py-1 shadow-md group-focus-within:visible group-hover:visible">
                {c.children.map((child) => (
                  <li key={child.slug}>
                    <Link
                      to="/kategori/$slug"
                      params={{ slug: child.slug }}
                      className="block px-3 py-2 hover:bg-accent"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

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

export function SiteHeader({ categories }: { categories: CategoryNode[] }) {
  return (
    <header className="bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-semibold text-primary">
          Aura Tekstil
        </Link>
        <SearchBox />
      </div>
      <CategoryMenu categories={categories} />
    </header>
  );
}
