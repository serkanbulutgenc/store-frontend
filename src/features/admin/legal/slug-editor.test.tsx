import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { slugFormSchema } from "./schemas";
import { LegalRedirects, LegalSlugEditor } from "./slug-editor";

const render = (owner: boolean, redirects: string[] = []) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <LegalSlugEditor page="kvkk" slug="kvkk-aydinlatma" redirects={redirects} owner={owner} />
    </QueryClientProvider>,
  );

describe("LegalSlugEditor", () => {
  it("shows the Owner the current address and the earlier ones", () => {
    const out = render(true, ["kvkk", "gizlilik"]);
    expect(out).toContain('value="kvkk-aydinlatma"');
    expect(out).toContain("Adresi değiştir");
    expect(out).toContain("/yasal/kvkk");
    expect(out).toContain("/yasal/gizlilik");
  });

  it("starts with the save button disabled: nothing has changed", () => {
    expect(render(true)).toMatch(/<button[^>]*disabled[^>]*>Adresi değiştir/);
  });

  it("says so when there are no earlier addresses", () => {
    expect(render(true)).toContain("Henüz eski bir adres yok.");
  });

  it("renders nothing for Staff", () => {
    expect(render(false, ["kvkk"])).toBe("");
  });
});

describe("LegalRedirects", () => {
  it("lists each earlier address", () => {
    const out = renderToStaticMarkup(<LegalRedirects redirects={["a", "b"]} />);
    expect(out.match(/<li/g)).toHaveLength(2);
  });
});

describe("slug form", () => {
  const check = (slug: string) => slugFormSchema.safeParse({ slug });
  it("accepts lowercase words joined by single hyphens", () => {
    expect(check("kvkk-aydinlatma-2").success).toBe(true);
  });
  it.each(["", " ", "Kvkk", "a_b", "a--b", "-a", "a-", "ağ", "a b", "x".repeat(101)])(
    "refuses %j",
    (slug) => expect(check(slug).success).toBe(false),
  );
  it("refuses the reserved slug", () => {
    expect(check("search").success).toBe(false);
  });
});
