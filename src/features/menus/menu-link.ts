import type { components } from "../../../api/specs/openapi-store";

export type MenuNode = components["schemas"]["MenuNode"];

export type MenuLink =
  | { kind: "heading" }
  | { kind: "internal"; to: string }
  | { kind: "external"; href: string; target: "_blank"; rel: "noopener" };

/** How a Menu item is rendered: a group heading links nowhere, an external address opens
 * in a new tab, anything else is a path inside the Storefront. */
export function menuLink(node: MenuNode): MenuLink {
  if (node.url === null) return { kind: "heading" };
  if (node.external) return { kind: "external", href: node.url, target: "_blank", rel: "noopener" };
  return { kind: "internal", to: node.url };
}

export type DrawerRow = { node: MenuNode; action: "drill" | "link" | "text" };

export type DrawerView = {
  /** The item the drawer has drilled into, or null at the top. */
  title: string | null;
  canGoBack: boolean;
  /** A link to the item the drawer is inside ("see all"), or null at the top or for a heading. */
  allLink: MenuLink | null;
  rows: DrawerRow[];
};

/** What the mobile drawer shows once the Shopper has entered the items in `trail`. It reads the
 * same tree as the desktop menu, one level at a time. */
export function drawerView(items: MenuNode[], trail: MenuNode[]): DrawerView {
  const current = trail.at(-1);
  const link = current ? menuLink(current) : null;
  return {
    title: current?.label ?? null,
    canGoBack: current !== undefined,
    allLink: link && link.kind !== "heading" ? link : null,
    rows: (current ? current.children : items).map((node) => ({
      node,
      action:
        node.children.length > 0 ? "drill" : menuLink(node).kind === "heading" ? "text" : "link",
    })),
  };
}

export type FooterColumn = { title: string | null; links: MenuNode[] };

/** The Footer menu is two levels: a group heading becomes a titled column of its links, and
 * links outside any heading stay together as an untitled list in their original order. */
export function footerColumns(items: MenuNode[]): FooterColumn[] {
  const columns: FooterColumn[] = [];
  for (const item of items) {
    if (menuLink(item).kind === "heading") {
      if (item.children.length > 0) columns.push({ title: item.label, links: item.children });
      continue;
    }
    const last = columns.at(-1);
    if (last && last.title === null) last.links.push(item);
    else columns.push({ title: null, links: [item] });
  }
  return columns;
}
