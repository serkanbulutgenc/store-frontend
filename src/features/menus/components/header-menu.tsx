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
import { drawerView, type MenuNode, menuLink } from "../menu-link";
import { MenuAnchor } from "./menu-anchor";

/** A Category item's image, or a neutral tile of the same size when it has none. */
function Thumbnail({ node, className }: { node: MenuNode; className: string }) {
  if (!node.image_url) {
    return (
      <span
        aria-hidden="true"
        className={`grid place-items-center bg-muted text-muted-foreground ${className}`}
      >
        <ImageIcon className="size-1/3" />
      </span>
    );
  }
  // Decorative: the label sits next to it.
  return (
    <img
      src={node.image_url}
      alt=""
      loading="lazy"
      className={`bg-muted object-cover ${className}`}
    />
  );
}

const linkClass =
  "block whitespace-nowrap px-3 py-3 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring";

/** Wraps a link in Radix's navigation link so it closes the panel; a heading is not a link. */
function PanelAnchor({
  node,
  className,
  children,
}: {
  node: MenuNode;
  className?: string;
  children?: React.ReactNode;
}) {
  if (menuLink(node).kind === "heading") {
    return (
      <MenuAnchor node={node} className={className}>
        {children}
      </MenuAnchor>
    );
  }
  return (
    <NavigationMenu.Link asChild>
      <MenuAnchor node={node} className={className}>
        {children}
      </MenuAnchor>
    </NavigationMenu.Link>
  );
}

/** Desktop (lg and up): top-level items in a bar; each with children opens a panel of cards
 * (image and label) with their own children listed beneath. */
export function DesktopHeaderMenu({ items }: { items: MenuNode[] }) {
  return (
    <NavigationMenu.Root
      aria-label="Kategoriler"
      delayDuration={120}
      skipDelayDuration={300}
      className="relative hidden border-t border-border lg:block"
    >
      <NavigationMenu.List className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4">
        {items.map((item, i) => (
          // The same target may appear twice, so labels and URLs are not unique keys.
          // biome-ignore lint/suspicious/noArrayIndexKey: Menu items have no id and are never reordered client-side
          <NavigationMenu.Item key={i}>
            {item.children.length === 0 ? (
              <PanelAnchor node={item} className={linkClass} />
            ) : (
              <>
                <NavigationMenu.Trigger
                  className={`${linkClass} cursor-pointer data-[state=open]:text-primary`}
                >
                  {item.label}
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="absolute inset-x-0 top-full z-20 max-h-[70vh] overflow-y-auto border-y border-border bg-card shadow-md">
                  <div className="mx-auto max-w-6xl px-4 py-6">
                    {menuLink(item).kind !== "heading" && (
                      <PanelAnchor
                        node={item}
                        className="mb-4 inline-block font-medium text-primary hover:underline"
                      >
                        Tüm {item.label}
                      </PanelAnchor>
                    )}
                    <ul className="grid grid-cols-4 gap-6 xl:grid-cols-5">
                      {item.children.map((child, j) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: see above
                        <li key={j}>
                          <PanelAnchor node={child} className="group block">
                            <Thumbnail node={child} className="aspect-square w-full rounded-md" />
                            <span className="mt-2 block font-medium group-hover:text-primary">
                              {child.label}
                            </span>
                          </PanelAnchor>
                          {child.children.length > 0 && (
                            <ul className="mt-1 space-y-1">
                              {child.children.map((leaf, k) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: see above
                                <li key={k}>
                                  <PanelAnchor
                                    node={leaf}
                                    className="text-sm text-muted-foreground hover:text-primary"
                                  />
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
export function MobileHeaderMenu({ items }: { items: MenuNode[] }) {
  const [open, setOpen] = useState(false);
  // The items entered so far; the last one's children are on screen.
  const [trail, setTrail] = useState<MenuNode[]>([]);
  const view = drawerView(items, trail);

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
          <SheetTitle>{view.title ?? "Kategoriler"}</SheetTitle>
          <SheetDescription className="sr-only">Kategorilere göz atın</SheetDescription>
        </SheetHeader>
        <nav aria-label="Kategoriler (mobil)">
          {view.canGoBack && (
            <>
              <button
                type="button"
                onClick={() => setTrail(trail.slice(0, -1))}
                className="flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Geri
              </button>
              {view.allLink && trail.at(-1) && (
                <MenuAnchor
                  node={trail.at(-1) as MenuNode}
                  onNavigate={() => onOpenChange(false)}
                  className="block border-b border-border px-4 py-3 font-medium text-primary"
                >
                  Tüm {view.title}
                </MenuAnchor>
              )}
            </>
          )}
          <ul>
            {view.rows.map(({ node, action }, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: see DesktopHeaderMenu
              <li key={i} className="border-b border-border">
                {action === "drill" ? (
                  <button
                    type="button"
                    onClick={() => setTrail([...trail, node])}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <Thumbnail node={node} className="size-12 shrink-0 rounded-md" />
                    <span className="flex-1">{node.label}</span>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                ) : (
                  <MenuAnchor
                    node={node}
                    onNavigate={() => onOpenChange(false)}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Thumbnail node={node} className="size-12 shrink-0 rounded-md" />
                    <span className="flex-1">{node.label}</span>
                  </MenuAnchor>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
