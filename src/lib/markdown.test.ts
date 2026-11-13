import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown } from "./markdown";

const text = (t: string) => ({ type: "text", text: t });

describe("inline", () => {
  it("parses bold, italic and strikethrough", () => {
    expect(parseInline("a **b** *c* _d_ ~~e~~")).toEqual([
      text("a "),
      { type: "bold", children: [text("b")] },
      text(" "),
      { type: "italic", children: [text("c")] },
      text(" "),
      { type: "italic", children: [text("d")] },
      text(" "),
      { type: "strike", children: [text("e")] },
    ]);
  });

  it("nests emphasis", () => {
    expect(parseInline("**a _b_**")).toEqual([
      { type: "bold", children: [text("a "), { type: "italic", children: [text("b")] }] },
    ]);
  });

  it("leaves unmatched markers and snake_case alone", () => {
    expect(parseInline("2 * 3 ve snake_case_name")).toEqual([text("2 * 3 ve snake_case_name")]);
    expect(parseInline("**açık")).toEqual([text("**açık")]);
  });

  it("honours backslash escapes", () => {
    expect(parseInline("\\*not\\*")).toEqual([text("*not*")]);
  });

  it("keeps HTML, links and images as plain text", () => {
    const html = "<script>alert(1)</script>";
    expect(parseInline(html)).toEqual([text(html)]);
    expect(parseInline("[a](https://x.test) https://y.test")).toEqual([
      text("[a](https://x.test) https://y.test"),
    ]);
  });

  it("keeps emoji", () => {
    expect(parseInline("süper 😄")).toEqual([text("süper 😄")]);
  });
});

describe("blocks", () => {
  it("splits paragraphs on blank lines and turns single newlines into breaks", () => {
    expect(parseMarkdown("bir\niki\n\nüç")).toEqual([
      { type: "paragraph", children: [text("bir"), { type: "br" }, text("iki")] },
      { type: "paragraph", children: [text("üç")] },
    ]);
  });

  it("parses bulleted lists with - or *", () => {
    expect(parseMarkdown("- a\n* **b**")).toEqual([
      { type: "list", items: [[text("a")], [{ type: "bold", children: [text("b")] }]] },
    ]);
  });

  it("does not make headings", () => {
    expect(parseMarkdown("# Başlık")).toEqual([
      { type: "paragraph", children: [text("# Başlık")] },
    ]);
  });

  it("is empty for blank input", () => {
    expect(parseMarkdown("  \n\n ")).toEqual([]);
  });
});

describe("review fixes", () => {
  it("handles triple asterisks as bold italic", () => {
    expect(parseInline("***harika***")).toEqual([
      { type: "bold", children: [{ type: "italic", children: [text("harika")] }] },
    ]);
  });
});
