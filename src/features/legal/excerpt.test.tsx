import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Excerpt } from "./excerpt";

describe("Excerpt", () => {
  it("marks the matched words and never emits markup from the text", () => {
    const html = renderToStaticMarkup(<Excerpt text="14 gün içinde «cayma» hakkı <b>x</b>" />);
    expect(html).toContain("<mark>cayma</mark>");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });
  it("shows text without marks as it is", () => {
    expect(renderToStaticMarkup(<Excerpt text="düz metin" />)).toContain("düz metin");
  });
});
