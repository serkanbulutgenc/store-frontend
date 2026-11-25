import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PreviewBanner } from "./preview-banner";

describe("PreviewBanner", () => {
  it("says this is a preview and links back to the Vitrin screen", () => {
    const out = renderToStaticMarkup(<PreviewBanner />);

    expect(out).toContain("Önizleme");
    expect(out).toContain('href="/admin/homepage"');
    expect(out).toContain('role="status"');
  });
});
