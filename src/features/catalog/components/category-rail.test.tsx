import { describe, expect, it } from "vitest";
import type { HomeCategory } from "../queries";
import { CategoryRail } from "./category-rail";
import { renderInStorefront } from "./render-in-storefront";

const cat = (slug: string, over: Partial<HomeCategory> = {}): HomeCategory => ({
  name: slug.toUpperCase(),
  slug,
  image_url: null,
  image_alt: "",
  ...over,
});

describe("CategoryRail", () => {
  it("shows each picked Category in order, as a link with its thumbnail", () => {
    const out = renderInStorefront(
      <CategoryRail
        categories={[
          cat("elbise", { image_url: "/media/e.webp", image_alt: "Elbiseler" }),
          cat("etek"),
        ]}
      />,
    );
    expect(out).toContain("Kategoriler");
    expect(out.indexOf("ELBISE")).toBeLessThan(out.indexOf("ETEK"));
    expect(out).toContain('href="/kategori/elbise"');
    expect(out).toContain('src="/media/e.webp"');
    expect(out).toContain('alt="Elbiseler"');
  });

  it("uses a placeholder for a Category without an image", () => {
    const out = renderInStorefront(<CategoryRail categories={[cat("etek")]} />);
    expect(out).toContain('data-testid="category-placeholder"');
    expect(out).not.toContain("<img");
  });

  it("renders nothing when none is picked", () => {
    expect(renderInStorefront(<CategoryRail categories={[]} />)).not.toContain("Kategoriler");
  });
});
