import type { ReactNode } from "react";

/** Inline `**bold**` and `[text](url)`; no raw HTML ever reaches the page. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[3] !== undefined && /^(https?:\/\/|\/(?!\/)|mailto:)/.test(m[3]))
      out.push(
        <a key={m.index} href={m[3]} className="text-primary underline">
          {m[2]}
        </a>,
      );
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Tiny Markdown subset for the legal pages: headings, paragraphs, lists, quotes. */
export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className="space-y-4 leading-relaxed">
      {blocks.map((block, i) => {
        const key = `${i}-${block.slice(0, 12)}`;
        const heading = /^(#{1,3})\s+(.*)$/.exec(block);
        if (heading) {
          const level = (heading[1] as string).length;
          const text = inline(heading[2] as string);
          if (level === 1)
            return (
              <h1 key={key} className="text-2xl font-semibold">
                {text}
              </h1>
            );
          if (level === 2)
            return (
              <h2 key={key} className="text-xl font-semibold">
                {text}
              </h2>
            );
          return (
            <h3 key={key} className="text-lg font-semibold">
              {text}
            </h3>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => /^[-*]\s+/.test(l)))
          return (
            <ul key={key} className="list-disc space-y-1 pl-5">
              {lines.map((l) => (
                <li key={l}>{inline(l.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every((l) => l.startsWith(">")))
          return (
            <blockquote key={key} className="rounded-md bg-muted px-3 py-2 text-muted-foreground">
              {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}
            </blockquote>
          );
        return (
          <p key={key} className="whitespace-pre-line">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}
