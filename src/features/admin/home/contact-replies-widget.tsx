import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { contactCalls, threadQuery, useContactMutation } from "../contact/queries";
import { type HomeData, homeKey } from "../returns/queries";
import { PREVIEW_ROWS, WidgetCard } from "./widget-card";

type Row = NonNullable<HomeData["contact_replies"]>["rows"][number];

/** Replies Staff wrote that wait for the Owner. Approve sends the email, so it sits behind a
 * confirmation showing the full text and the address; editing or rejecting happens in the thread. */
export function ContactRepliesWidget({ data }: { data: NonNullable<HomeData["contact_replies"]> }) {
  const [target, setTarget] = useState<Row | null>(null);
  return (
    <WidgetCard
      id="widget-contact-replies"
      title="Onay bekleyen yanıtlar"
      count={data.count}
      empty="Onay bekleyen yanıt yok."
      seeAll={
        <Link to="/admin/contact" search={{ pending: true }} className="text-primary underline">
          Tümünü gör ({data.count})
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {data.rows.slice(0, PREVIEW_ROWS).map((r) => (
          <li key={r.reply_id} className="space-y-1 py-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/admin/contact/$threadId"
                params={{ threadId: String(r.thread_id) }}
                className="font-medium underline-offset-2 hover:underline"
              >
                {r.shopper || "İsimsiz"} · {r.category}
              </Link>
              <span className="text-muted-foreground">
                {r.author?.name ?? "—"} · {formatDate(r.written_at)}
              </span>
              <Button
                size="sm"
                variant="outline"
                aria-label={`${r.shopper || "Yanıt"} yanıtını onayla`}
                onClick={() => setTarget(r)}
              >
                Onayla
              </Button>
            </div>
            <p className="line-clamp-2 text-muted-foreground">{r.excerpt}</p>
          </li>
        ))}
      </ul>
      <Dialog
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Yanıtı onayla ve gönder"
        size="lg"
      >
        {target && <ConfirmSend row={target} onClose={() => setTarget(null)} />}
      </Dialog>
    </WidgetCard>
  );
}

function ConfirmSend({ row, onClose }: { row: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const thread = useQuery(threadQuery(row.thread_id));
  const reply = thread.data?.messages.find((m) => m.id === row.reply_id);
  const send = useContactMutation((id: number) => contactCalls.approve(id));
  return (
    <div className="space-y-3 text-sm">
      {reply && thread.data ? (
        <>
          <p>
            Yanıt <strong>{thread.data.email || "müşteriye"}</strong> adresine e-postayla
            gönderilecek.
          </p>
          <blockquote className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3">
            {reply.body}
          </blockquote>
        </>
      ) : (
        <p role="status" className="text-muted-foreground">
          {thread.isError ? "Yanıt yüklenemedi." : "Yükleniyor…"}
        </p>
      )}
      <p className="text-muted-foreground">
        Metni değiştirmek veya reddetmek için{" "}
        <Link
          to="/admin/contact/$threadId"
          params={{ threadId: String(row.thread_id) }}
          className="text-primary underline"
        >
          yazışmayı açın
        </Link>
        .
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <Button
          size="sm"
          disabled={send.isPending || !reply}
          onClick={() =>
            send.mutate(row.reply_id, {
              onSuccess: async () => {
                await qc.invalidateQueries({ queryKey: homeKey });
                toast.success("Yanıt gönderildi.");
                onClose();
              },
            })
          }
        >
          Onayla ve gönder
        </Button>
      </div>
    </div>
  );
}
