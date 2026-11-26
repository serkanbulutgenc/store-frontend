import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SizeGuideContent, SizePickerExtras } from "./size-guide";

const html = (product: { slug?: string; has_size_guide: boolean; fit_note: string }) =>
  renderToStaticMarkup(<SizePickerExtras product={{ slug: "elbise", ...product }} />);

describe("SizePickerExtras", () => {
  it("shows the Beden tablosu link when a guide applies", () => {
    const out = html({ has_size_guide: true, fit_note: "" });

    expect(out).toMatch(/<button[^>]*>(<svg.*<\/svg>)?[^<]*Beden tablosu/);
  });

  it("hides the link for a One-size Product or when no guide applies", () => {
    // The API reports has_size_guide false for both.
    const out = html({ has_size_guide: false, fit_note: "" });

    expect(out).not.toContain("Beden tablosu");
    expect(out).toBe("");
  });

  it("shows the Kalıp notu only when one is set", () => {
    expect(html({ has_size_guide: false, fit_note: "" })).not.toContain("Kalıp notu");

    const out = html({ has_size_guide: false, fit_note: "Dar kalıp, bir beden büyük alın" });

    expect(out).toContain("Kalıp notu");
    expect(out).toContain("Dar kalıp, bir beden büyük alın");
  });

  it("puts no dialog and no guide text in the server-rendered HTML", () => {
    const out = html({ has_size_guide: true, fit_note: "" });

    expect(out).not.toContain('role="dialog"');
    expect(out).not.toContain("<table");
  });
});

describe("SizeGuideContent", () => {
  it("renders the guide with the Description renderer, tables included", () => {
    const out = renderToStaticMarkup(
      <SizeGuideContent text={"**Nasıl ölçülür?**\n\n| Beden | Göğüs |\n|---|---|\n| S | 88 |"} />,
    );

    expect(out).toContain("<strong>Nasıl ölçülür?</strong>");
    expect(out).toContain("<table");
    expect(out).toContain("<td>88</td>");
  });

  it("ignores raw HTML in a guide, like a Description", () => {
    const out = renderToStaticMarkup(
      <SizeGuideContent text={"Ölçü\n\n<script>alert(1)</script>"} />,
    );

    expect(out).not.toContain("<script");
    expect(out).toContain("Ölçü");
  });

  it("says it is loading, and says so politely when loading failed", () => {
    expect(renderToStaticMarkup(<SizeGuideContent />)).toMatch(/role="status"[^>]*>Yükleniyor/);
    expect(renderToStaticMarkup(<SizeGuideContent failed />)).toMatch(/role="alert"/);
  });
});
