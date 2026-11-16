import { describe, expect, it } from "vitest";
import { drawerView, footerColumns, type MenuNode, menuLink } from "./menu-link";

const node = (over: Partial<MenuNode>): MenuNode => ({
  label: "Giyim",
  url: "/kategori/giyim",
  external: false,
  image_url: null,
  children: [],
  ...over,
});

describe("menuLink", () => {
  it("links an internal item to its path without opening a new tab", () => {
    expect(menuLink(node({}))).toEqual({ kind: "internal", to: "/kategori/giyim" });
  });

  it("opens an external item in a new tab with rel=noopener", () => {
    expect(menuLink(node({ url: "https://blog.example/yeni", external: true }))).toEqual({
      kind: "external",
      href: "https://blog.example/yeni",
      target: "_blank",
      rel: "noopener",
    });
  });

  it("treats an item with no url as a group heading that links nowhere", () => {
    expect(menuLink(node({ url: null, children: [node({})] }))).toEqual({ kind: "heading" });
  });
});

describe("drawerView", () => {
  const giyim = node({
    label: "Giyim",
    url: "/kategori/giyim",
    children: [
      node({ label: "Tişört", url: "/kategori/tisort" }),
      node({ label: "Blog", url: "https://blog.example", external: true }),
    ],
  });
  const marka = node({
    label: "Markalar",
    url: null,
    children: [node({ label: "Aura", url: "/marka/aura" })],
  });
  const items = [giyim, marka, node({ label: "Sepet", url: "/sepet" })];

  it("at the top shows every item with no way back", () => {
    const view = drawerView(items, []);
    expect(view.title).toBeNull();
    expect(view.canGoBack).toBe(false);
    expect(view.allLink).toBeNull();
    expect(view.rows.map((r) => [r.node.label, r.action])).toEqual([
      ["Giyim", "drill"],
      ["Markalar", "drill"],
      ["Sepet", "link"],
    ]);
  });

  it("inside an item shows its children, a way back, and a link to the item itself", () => {
    const view = drawerView(items, [giyim]);
    expect(view.title).toBe("Giyim");
    expect(view.canGoBack).toBe(true);
    expect(view.allLink).toEqual({ kind: "internal", to: "/kategori/giyim" });
    expect(view.rows.map((r) => r.node.label)).toEqual(["Tişört", "Blog"]);
  });

  it("offers no link to a group heading, since it links nowhere", () => {
    expect(drawerView(items, [marka]).allLink).toBeNull();
  });

  it("shows a childless group heading as plain text", () => {
    const empty = node({ label: "Boş", url: null });
    expect(drawerView([empty], []).rows[0]?.action).toBe("text");
  });
});

describe("footerColumns", () => {
  const link = (label: string) => node({ label, url: `/${label}` });
  const heading = (label: string, children: MenuNode[]) => node({ label, url: null, children });

  it("keeps a flat Footer menu as one untitled list, as the Storefront had before Menus", () => {
    const items = [link("a"), link("b"), link("c")];
    expect(footerColumns(items)).toEqual([{ title: null, links: items }]);
  });

  it("turns each group heading into a titled column of its links", () => {
    const yasal = heading("Yasal", [link("kvkk"), link("iade")]);
    const yardim = heading("Yardım", [link("siparis-takip")]);
    expect(footerColumns([yasal, yardim])).toEqual([
      { title: "Yasal", links: yasal.children },
      { title: "Yardım", links: yardim.children },
    ]);
  });

  it("gathers loose links around headings into untitled columns, in order", () => {
    const yasal = heading("Yasal", [link("kvkk")]);
    expect(footerColumns([link("a"), yasal, link("b"), link("c")])).toEqual([
      { title: null, links: [link("a")] },
      { title: "Yasal", links: yasal.children },
      { title: null, links: [link("b"), link("c")] },
    ]);
  });

  it("drops a group heading with nothing under it", () => {
    expect(footerColumns([heading("Boş", []), link("a")])).toEqual([
      { title: null, links: [link("a")] },
    ]);
  });
});
