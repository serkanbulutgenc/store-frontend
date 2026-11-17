import type { Nodes } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { remarkGfmTables } from "./remark-gfm-tables";

// The same parser and extensions the renderer uses, so both read a Description alike.
const parser = unified().use(remarkParse).use(remarkGfmTables);

// These sit inside a line of text, so their words join the text around them.
const INLINE = new Set(["text", "inlineCode", "strong", "emphasis", "link", "linkReference"]);

/** The words of a node: images and raw HTML contribute nothing. */
function words(node: Nodes): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
    case "code":
      return node.value;
    case "image":
    case "html":
      return "";
    case "break":
      return " ";
    default:
      if (!("children" in node)) return "";
      return node.children.map((c) => (INLINE.has(c.type) ? words(c) : ` ${words(c)} `)).join("");
  }
}

/**
 * Plain text for places that cannot show a Description's formatting: quick view and
 * SEO. Cut to `maxLength` characters with an ellipsis when it is longer.
 */
export function descriptionExcerpt(markdown: string, maxLength?: number): string {
  const text = words(parser.parse(markdown)).replace(/\s+/g, " ").trim();
  if (maxLength === undefined || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
