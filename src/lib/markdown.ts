/**
 * Basic review markdown: bold, italic, strikethrough, paragraphs, line breaks and bulleted lists.
 * Everything else (HTML, headings, links, images) stays plain text. The result is a small tree
 * that React renders as elements, so there is never an HTML string to inject.
 */
export type Inline =
  | { type: "text"; text: string }
  | { type: "br" }
  | { type: "bold" | "italic" | "strike"; children: Inline[] };

export type Block = { type: "paragraph"; children: Inline[] } | { type: "list"; items: Inline[][] };

const WORD = /[\p{L}\p{N}]/u;

function closing(s: string, from: number, delim: string, wordBound: boolean): number {
  let j = s.indexOf(delim, from);
  while (j !== -1) {
    const next = s.charAt(j + delim.length);
    const before = s.charAt(j - 1);
    if (before !== " " && (!wordBound || !next || !WORD.test(next))) return j;
    j = s.indexOf(delim, j + 1);
  }
  return -1;
}

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ type: "text", text: buf });
    buf = "";
  };
  let i = 0;
  while (i < s.length) {
    const c = s.charAt(i);
    if (c === "\\" && i + 1 < s.length && "*_~\\".includes(s.charAt(i + 1))) {
      buf += s.charAt(i + 1);
      i += 2;
      continue;
    }
    if (c === "\n") {
      flush();
      out.push({ type: "br" });
      i += 1;
      continue;
    }
    if (s.startsWith("***", i)) {
      const j = s.indexOf("***", i + 3);
      if (j > i + 3) {
        flush();
        out.push({
          type: "bold",
          children: [{ type: "italic", children: parseInline(s.slice(i + 3, j)) }],
        });
        i = j + 3;
        continue;
      }
    }
    const pair = s.startsWith("**", i) ? "**" : s.startsWith("~~", i) ? "~~" : null;
    if (pair) {
      const j = s.indexOf(pair, i + 2);
      if (j > i + 2) {
        flush();
        out.push({
          type: pair === "**" ? "bold" : "strike",
          children: parseInline(s.slice(i + 2, j)),
        });
        i = j + 2;
        continue;
      }
    }
    if (c === "*" || c === "_") {
      // An underscore inside a word (snake_case) is not emphasis.
      const startsWord = c === "_" && i > 0 && WORD.test(s.charAt(i - 1));
      const j = startsWord ? -1 : closing(s, i + 1, c, c === "_");
      if (j > i + 1 && s.charAt(i + 1) !== " ") {
        flush();
        out.push({ type: "italic", children: parseInline(s.slice(i + 1, j)) });
        i = j + 1;
        continue;
      }
    }
    buf += c;
    i += 1;
  }
  flush();
  return out;
}

const BULLET = /^\s{0,3}[-*]\s+(.*)$/;

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let items: Inline[][] = [];
  const endParagraph = () => {
    if (paragraph.length)
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join("\n")) });
    paragraph = [];
  };
  const endList = () => {
    if (items.length) blocks.push({ type: "list", items });
    items = [];
  };
  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    if (line.trim() === "") {
      endParagraph();
      endList();
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      endParagraph();
      items.push(parseInline(bullet[1] ?? ""));
    } else {
      endList();
      paragraph.push(line.trim());
    }
  }
  endParagraph();
  endList();
  return blocks;
}
