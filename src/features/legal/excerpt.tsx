/** A search excerpt: the API marks matched words with « », shown here as <mark>. Plain text only. */
export function Excerpt({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»)/);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("«") ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and never reordered
          <mark key={i}>{part.slice(1, part.endsWith("»") ? -1 : undefined)}</mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional and never reordered
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
