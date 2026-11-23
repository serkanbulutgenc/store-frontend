import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ReplyOut } from "./queries";
import { replyStateLabel, replyStateTone } from "./rules";

const TIME = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });
export const formatWhen = (iso: string) => TIME.format(new Date(iso));

/** One message of a thread: the Shopper's, or a reply with where it is on its way. */
export function MessageCard({
  message,
  actions,
}: {
  message: ReplyOut;
  actions?: React.ReactNode;
}) {
  const shopper = message.kind === "shopper";
  return (
    <article
      aria-label={shopper ? "Müşteri mesajı" : "Yanıt"}
      className={`space-y-2 rounded-md border border-border p-3 ${shopper ? "bg-card" : "bg-muted/40"}`}
    >
      <header className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {shopper ? "Müşteri" : (message.author?.name ?? "Personel")}
        </span>
        <span>{formatWhen(message.created_at)}</span>
        {!shopper && (
          <Badge tone={replyStateTone(message.state)}>{replyStateLabel(message.state)}</Badge>
        )}
        {message.sent_at && <span>Gönderildi: {formatDate(message.sent_at)}</span>}
      </header>
      <p className="whitespace-pre-wrap text-sm">{message.body}</p>
      {message.drafted_body && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Personelin taslağı (sahip düzenledi)
          </summary>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{message.drafted_body}</p>
        </details>
      )}
      {message.state === "rejected" && (
        <p role="note" className="text-sm text-red-700">
          Reddedildi{message.decided_by ? ` (${message.decided_by.name})` : ""}
          {message.rejection_note ? `: ${message.rejection_note}` : "."}
        </p>
      )}
      {actions}
    </article>
  );
}

/** The thread in order. */
export function MessageList({
  messages,
  actionsFor,
}: {
  messages: ReplyOut[];
  actionsFor?: (message: ReplyOut) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <MessageCard key={m.id} message={m} actions={actionsFor?.(m)} />
      ))}
    </div>
  );
}
