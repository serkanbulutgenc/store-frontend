import type { ReactNode } from "react";
import { type Inline, parseMarkdown } from "@/lib/markdown";

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    const key = `${n.type}-${i}`;
    switch (n.type) {
      case "text":
        return n.text;
      case "br":
        return <br key={key} />;
      case "bold":
        return <strong key={key}>{renderInline(n.children)}</strong>;
      case "italic":
        return <em key={key}>{renderInline(n.children)}</em>;
      default:
        return <s key={key}>{renderInline(n.children)}</s>;
    }
  });
}

/** Review text rendered from basic markdown as React elements (never as HTML). */
export function MarkdownText({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      {parseMarkdown(source).map((b, i) =>
        b.type === "paragraph" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: the tree is rebuilt from the source each render
          <p key={i} className="mb-2 last:mb-0">
            {renderInline(b.children)}
          </p>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: as above
          <ul key={i} className="mb-2 list-disc pl-5 last:mb-0">
            {b.items.map((item, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: as above
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
