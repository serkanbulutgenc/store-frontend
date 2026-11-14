import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ImageIcon, Menu } from "lucide-react";
import { NavigationMenu } from "radix-ui";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CategoryNode } from "../queries";

/** A category's thumbnail, or a neutral tile of the same size when it has none. */
function Thumbnail({ category, className }: { category: CategoryNode; className: string }) {
  if (!category.image_url) {
    return (
      <span
        aria-hidden="true"
        className={`grid place-items-center bg-muted text-muted-foreground ${className}`}
      >
        <ImageIcon className="size-1/3" />
      </span>
    );
  }
  // Decorative: the category name sits next to it.
  return (
    <img
      src={category.image_url}
      alt=""
      loading="lazy"
      className={`bg-muted object-cover ${className}`}
    />
  );
}

const linkClass =
  "block whitespace-nowrap px-3 py-3 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring";

/** Desktop (lg and up): root categories in a bar; each with children opens a panel of
 * sub-category cards (thumbnail and name) with their own children listed beneath. */
export function DesktopCategoryMenu({ categories }: { categories: CategoryNode[] }) {
  return (
    <NavigationMenu.Root
      aria-label="Kategoriler"
      delayDuration={120}
      skipDelayDuration={300}
      className="relative hidden border-t border-border lg:block"
    >
      <NavigationMenu.List className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4">
        {categories.map((c) => (
          <NavigationMenu.Item key={c.slug}>
            {c.children.length === 0 ? (
              <NavigationMenu.Link asChild>
                <Link to="/kategori/$slug" params={{ slug: c.slug }} className={linkClass}>
                  {c.name}
                </Link>
              </NavigationMenu.Link>
            ) : (
              <>
                <NavigationMenu.Trigger
                  className={`${linkClass} cursor-pointer data-[state=open]:text-primary`}
                >
                  {c.name}
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute inset-x-0 top-full z-20 max-h-[70vh] overflow-y-auto border-y border-border bg-card shadow-md">
                  <div className="mx-auto max-w-6xl px-4 py-6">
                    <NavigationMenu.Link asChild>
                      <Link
                        to="/kategori/$slug"
                        params={{ slug: c.slug }}
                        className="mb-4 inline-block font-medium text-primary hover:underline"
                      >
                        Tüm {c.name}
                      </Link>
                    </NavigationMenu.Link>
                    <ul className="grid grid-cols-4 gap-6 xl:grid-cols-5">
                      {c.children.map((child) => (
                        <li key={child.slug}>
                          <NavigationMenu.Link asChild>
                            <Link
                              to="/kategori/$slug"
                              params={{ slug: child.slug }}
                              className="group block"
                            >
                              <Thumbnail
                                category={child}
                                className="aspect-square w-full rounded-md"
                              />
                              <span className="mt-2 block font-medium group-hover:text-primary">
                                {child.name}
                              </span>
                            </Link>
                          </NavigationMenu.Link>
                          {child.children.length > 0 && (
                            <ul className="mt-1 space-y-1">
                              {child.children.map((leaf) => (
                                <li key={leaf.slug}>
                                  <NavigationMenu.Link asChild>
                                    <Link
                                      to="/kategori/$slug"
                                      params={{ slug: leaf.slug }}
                                      className="text-sm text-muted-foreground hover:text-primary"
                                    >
                                      {leaf.name}
                                    </Link>
                                  </NavigationMenu.Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenu.Content>
              </>
            )}
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/** Below lg: a hamburger opening a drawer that drills down one level at a time. */
export function MobileCategoryMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  // The categories entered so far; the last one's children are on screen.
  const [trail, setTrail] = useState<CategoryNode[]>([]);
  const current = trail.at(-1);
  const rows = current ? current.children : categories;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTrail([]);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger aria-label="Kategoriler" className="grid size-10 place-items-center lg:hidden">
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{current ? current.name : "Kategoriler"}</SheetTitle>
          <SheetDescription className="sr-only">Kategorilere göz atın</SheetDescription>
        </SheetHeader>
        <nav aria-label="Kategoriler (mobil)">
          {current && (
            <>
              <button
                type="button"
                onClick={() => setTrail(trail.slice(0, -1))}
                className="flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Geri
              </button>
              <Link
                to="/kategori/$slug"
                params={{ slug: current.slug }}
                onClick={() => onOpenChange(false)}
                className="block border-b border-border px-4 py-3 font-medium text-primary"
              >
                Tüm {current.name}
              </Link>
            </>
          )}
          <ul>
            {rows.map((c) => (
              <li key={c.slug} className="border-b border-border">
                {c.children.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTrail([...trail, c])}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <Thumbnail category={c} className="size-12 shrink-0 rounded-md" />
                    <span className="flex-1">{c.name}</span>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    to="/kategori/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Thumbnail category={c} className="size-12 shrink-0 rounded-md" />
                    <span className="flex-1">{c.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
