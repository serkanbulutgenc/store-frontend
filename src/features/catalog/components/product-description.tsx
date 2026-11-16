import type { ComponentProps } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/** The only elements a Description may produce. Anything else keeps its text only. */
const ALLOWED_ELEMENTS = [
  "p",
  "strong",
  "em",
  "br",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const heading = (Tag: "h3" | "h4" | "h5" | "h6", className: string) =>
  function Heading({ children }: ComponentProps<"h3">) {
    return <Tag className={className}>{children}</Tag>;
  };

// The page owns h1 and h2, so # and ## become h3.
const h3 = heading("h3", "mt-4 text-lg font-semibold text-foreground");

const LINK_PROTOCOLS = /^(https?:|mailto:)/i;

/** Links: http(s) and mailto only. Images: only our own `/media/` files. */
function urlTransform(url: string, key: string): string {
  if (key === "href") return LINK_PROTOCOLS.test(url) ? url : "";
  if (key === "src") return url.startsWith("/media/") ? url : "";
  return "";
}

const components: Components = {
  // A wide table scrolls inside its own box instead of widening the page.
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm [&_td]:border-b [&_td]:px-3 [&_td]:py-2 [&_th]:border-b-2 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-foreground">
        {children}
      </table>
    </div>
  ),
  // urlTransform leaves an empty src for anything that is not our own file.
  img: ({ src, alt }) =>
    src ? (
      <img src={src} alt={alt ?? ""} loading="lazy" className="h-auto max-w-full rounded-md" />
    ) : null,
  a: ({ href, children }) =>
    href ? (
      <a href={href} rel="nofollow noopener" className="underline underline-offset-4">
        {children}
      </a>
    ) : (
      children
    ),
  h1: h3,
  h2: h3,
  h3,
  h4: heading("h4", "mt-3 font-semibold text-foreground"),
  h5: heading("h5", "mt-3 text-sm font-semibold text-foreground"),
  h6: heading("h6", "mt-3 text-sm font-medium text-foreground"),
};

/** A Product's Description: Markdown written by Owner or Staff, rendered safely. */
export function ProductDescription({ source }: { source: string }) {
  return (
    <div className="max-w-3xl space-y-3 text-muted-foreground">
      <Markdown
        skipHtml
        urlTransform={urlTransform}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        components={components}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {source}
      </Markdown>
    </div>
  );
}
