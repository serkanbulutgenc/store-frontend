/**
 * Text edits behind the Description toolbar. Each takes the textarea's text and selection and
 * returns the new text and selection, so the component only has to apply the result.
 */
export type Edit = { text: string; start: number; end: number };

/** How many `*` sit right before and after the selection (bold is 2, italics 1, both 3). */
function starRun({ text, start, end }: Edit): number {
  let before = 0;
  while (text[start - 1 - before] === "*") before++;
  let after = 0;
  while (text[end + after] === "*") after++;
  return Math.min(before, after);
}

/** Bold (`**`) or italic (`*`): wrap the selection, or unwrap it when it is already wrapped. */
export function wrapSelection(edit: Edit, marker: string, placeholder: string): Edit {
  const { text, start, end } = edit;
  const n = marker.length;
  const run = starRun(edit);
  // Bold needs two stars of the run, italics an odd one (a lone star, or the third of three).
  const wrapped = n === 2 ? run >= 2 : run % 2 === 1;
  if (wrapped) {
    return {
      text: text.slice(0, start - n) + text.slice(start, end) + text.slice(end + n),
      start: start - n,
      end: end - n,
    };
  }
  const inner = start === end ? placeholder : text.slice(start, end);
  return {
    text: text.slice(0, start) + marker + inner + marker + text.slice(end),
    start: start + n,
    end: start + n + inner.length,
  };
}

export type LineKind = "bullet" | "number" | "heading";

const OWN_MARKER: Record<LineKind, RegExp> = {
  bullet: /^- /,
  number: /^\d+\. /,
  heading: /^### /,
};
// Any list or heading marker, so switching from a bullet to a number replaces it.
const ANY_MARKER = /^(?:#{1,6} |[-*+] |\d+[.)] )/;

/**
 * Heading (h3, the smallest the page allows below its own h1 and h2), bullet or numbered list
 * on every line touched by the selection. Applying it to lines that already have it removes it.
 */
export function prefixLines(edit: Edit, kind: LineKind): Edit {
  const { text, start, end } = edit;
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const found = text.indexOf("\n", end);
  const lineEnd = found === -1 ? text.length : found;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const filled = lines.filter((l) => l.trim() !== "");
  const remove = filled.length > 0 && filled.every((l) => OWN_MARKER[kind].test(l));

  let n = 0;
  const changed = lines.map((line) => {
    if (line.trim() === "") return line;
    const bare = line.replace(remove ? OWN_MARKER[kind] : ANY_MARKER, "");
    if (remove) return bare;
    n++;
    return `${kind === "bullet" ? "- " : kind === "number" ? `${n}. ` : "### "}${bare}`;
  });
  const joined = changed.join("\n");
  const result = text.slice(0, lineStart) + joined + text.slice(lineEnd);
  if (start !== end) return { text: result, start: lineStart, end: lineStart + joined.length };
  const firstDelta = (changed[0] ?? "").length - (lines[0] ?? "").length;
  const cursor = Math.max(lineStart, start + firstDelta);
  return { text: result, start: cursor, end: cursor };
}

const LINK_TEXT = "bağlantı metni";
const LINK_ADDRESS = "https://";
export const ALT_PLACEHOLDER = "görsel açıklaması";

/** `[text](https://)`: the selection becomes the text, and the address is left selected. */
export function insertLink({ text, start, end }: Edit): Edit {
  const label = start === end ? LINK_TEXT : text.slice(start, end);
  const link = `[${label}](${LINK_ADDRESS})`;
  const result = text.slice(0, start) + link + text.slice(end);
  if (start === end) return { text: result, start: start + 1, end: start + 1 + label.length };
  const addressAt = start + label.length + 3;
  return { text: result, start: addressAt, end: addressAt + LINK_ADDRESS.length };
}

/** Blank lines needed so `block` stands as its own paragraph between `before` and `after`. */
function gap(side: string, edge: "end" | "start"): string {
  if (side === "") return "";
  const run = edge === "end" ? /\n*$/.exec(side)?.[0] : /^\n*/.exec(side)?.[0];
  return "\n".repeat(Math.max(0, 2 - (run?.length ?? 0)));
}

function insertBlock({ text, start, end }: Edit, block: string, select: string): Edit {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const lead = gap(before, "end");
  const trail = gap(after, "start");
  const at = before.length + lead.length + block.indexOf(select);
  return {
    text: before + lead + block + trail + after,
    start: at,
    end: at + select.length,
  };
}

export function insertImage(edit: Edit, url: string): Edit {
  return insertBlock(edit, `![${ALT_PLACEHOLDER}](${url})`, ALT_PLACEHOLDER);
}

export function insertTable(edit: Edit): Edit {
  return insertBlock(edit, "| Başlık 1 | Başlık 2 |\n| --- | --- |\n| Hücre | Hücre |", "Başlık 1");
}

/** Images the Dashboard should warn about: no alt text, or the placeholder left in. */
export function imagesMissingAlt(markdown: string): number {
  let missing = 0;
  for (const m of markdown.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)) {
    const alt = (m[1] ?? "").trim();
    if (alt === "" || alt === ALT_PLACEHOLDER) missing++;
  }
  return missing;
}
