import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import { gfmTable } from "micromark-extension-gfm-table";
import type { Processor } from "unified";

/**
 * GitHub-flavoured Markdown limited to tables. `remark-gfm` cannot switch its other parts
 * off, and a Description allows no strikethrough, no bare-URL links and no task lists. The
 * renderer and the excerpt both use this, so they read a Description alike. Parsing only:
 * nothing here turns a tree back into Markdown.
 */
export function remarkGfmTables(this: Processor) {
  const data = this.data();
  data.micromarkExtensions = [...(data.micromarkExtensions ?? []), gfmTable()];
  data.fromMarkdownExtensions = [...(data.fromMarkdownExtensions ?? []), gfmTableFromMarkdown()];
}
