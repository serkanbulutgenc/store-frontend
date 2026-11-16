import { describe, expect, it } from "vitest";
import {
  type Edit,
  imagesMissingAlt,
  insertImage,
  insertLink,
  insertTable,
  prefixLines,
  wrapSelection,
} from "./description-editor";

/** `|` marks the cursor, `[` `]` the selection, so cases read like the editor looks. */
function edit(marked: string): Edit {
  const start = marked.indexOf("[") >= 0 ? marked.indexOf("[") : marked.indexOf("|");
  const plain = marked.replace(/[[\]|]/g, "");
  const end = marked.indexOf("]") >= 0 ? marked.indexOf("]") - 1 : start;
  return { text: plain, start, end };
}
function show({ text, start, end }: Edit): string {
  if (start === end) return `${text.slice(0, start)}|${text.slice(start)}`;
  return `${text.slice(0, start)}[${text.slice(start, end)}]${text.slice(end)}`;
}

describe("wrapSelection", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(show(wrapSelection(edit("a [pamuk] b"), "**", "kalın"))).toBe("a **[pamuk]** b");
    expect(show(wrapSelection(edit("a [pamuk] b"), "*", "italik"))).toBe("a *[pamuk]* b");
  });

  it("inserts a selected placeholder when nothing is selected", () => {
    expect(show(wrapSelection(edit("a | b"), "**", "kalın"))).toBe("a **[kalın]** b");
  });

  it("unwraps a selection that is already wrapped", () => {
    expect(show(wrapSelection(edit("a **[pamuk]** b"), "**", "kalın"))).toBe("a [pamuk] b");
  });

  it("adds italics to bold text instead of mistaking its stars for italics", () => {
    expect(show(wrapSelection(edit("**[pamuk]**"), "*", "italik"))).toBe("***[pamuk]***");
    expect(show(wrapSelection(edit("***[pamuk]***"), "*", "italik"))).toBe("**[pamuk]**");
  });
});

describe("prefixLines", () => {
  it("turns every selected line into a bullet and back", () => {
    const bulleted = prefixLines(edit("ilk\n[iki\nüç]\ndört"), "bullet");
    expect(bulleted.text).toBe("ilk\n- iki\n- üç\ndört");

    expect(prefixLines({ ...bulleted, start: 4, end: bulleted.end }, "bullet").text).toBe(
      "ilk\niki\nüç\ndört",
    );
  });

  it("numbers lines from 1 and replaces another list marker", () => {
    expect(prefixLines(edit("[bir\niki]"), "number").text).toBe("1. bir\n2. iki");
    expect(prefixLines(edit("[- bir\n- iki]"), "number").text).toBe("1. bir\n2. iki");
  });

  it("makes a heading of the cursor's line, h3 by default, and keeps the cursor in the text", () => {
    const out = prefixLines(edit("önce\nbaşl|ık"), "heading");
    expect(out.text).toBe("önce\n### başlık");
    expect(show(out)).toBe("önce\n### başl|ık");
  });
});

describe("insertLink", () => {
  it("makes the selection the link text and selects the address to type", () => {
    expect(show(insertLink(edit("bkz [kılavuz] son")))).toBe("bkz [kılavuz]([https://]) son");
  });

  it("inserts a placeholder link with its text selected when nothing is selected", () => {
    expect(show(insertLink(edit("a | b")))).toBe("a [[bağlantı metni]](https://) b");
  });
});

describe("blocks: images and tables", () => {
  it("puts an image on its own paragraph with its alt text selected", () => {
    const out = insertImage(edit("önce|sonra"), "/media/description/a.jpg");

    expect(out.text).toBe("önce\n\n![görsel açıklaması](/media/description/a.jpg)\n\nsonra");
    expect(out.text.slice(out.start, out.end)).toBe("görsel açıklaması");
  });

  it("adds no blank lines that are already there, or at the ends of the text", () => {
    expect(insertImage(edit("|"), "/media/a.jpg").text).toBe("![görsel açıklaması](/media/a.jpg)");
    expect(insertImage(edit("önce\n\n|"), "/media/a.jpg").text).toBe(
      "önce\n\n![görsel açıklaması](/media/a.jpg)",
    );
  });

  it("inserts a two-column table the storefront renders as a table", () => {
    const out = insertTable(edit("|"));

    expect(out.text).toBe("| Başlık 1 | Başlık 2 |\n| --- | --- |\n| Hücre | Hücre |");
    expect(out.text.slice(out.start, out.end)).toBe("Başlık 1");
  });
});

describe("imagesMissingAlt", () => {
  it("counts images whose alt text is empty or still the placeholder", () => {
    const md =
      "![](/media/a.jpg) ![görsel açıklaması](/media/b.jpg) ![ ](/media/c.jpg) ![Ön yüz](/media/d.jpg)";

    expect(imagesMissingAlt(md)).toBe(3);
    expect(imagesMissingAlt("metin [bağlantı](https://x.com)")).toBe(0);
  });
});
