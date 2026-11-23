import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import type { Me } from "@/lib/api/me";
import { contactCalls, type ReplyOut, threadQuery, useContactMutation } from "./queries";
import {
  canSend,
  NOTE_MAX,
  noteError,
  REPLY_MAX,
  type ReplyAction,
  replyActions,
  replyError,
  THREAD_STATUSES,
  threadStatusLabel,
  threadStatusTone,
} from "./rules";
import { MessageList } from "./thread-parts";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

export function ThreadScreen({ threadId, me }: { threadId: number; me: Me }) {
  const { data: thread } = useSuspenseQuery(threadQuery(threadId));
  const setStatus = useContactMutation((status: string) =>
    contactCalls.setStatus(threadId, status),
  );
  const assign = useContactMutation((id: number | null) => contactCalls.assign(threadId, id));
  const fail = (e: unknown) => toast.error(message(e));
  const mine = thread.assignee?.id === me.id;
  return (
    <div className="space-y-4">
      <Link to="/admin/contact" className="text-sm text-muted-foreground hover:underline">
        ← İletişim mesajları
      </Link>
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">
            {thread.anonymised ? "Anonimleştirilmiş yazışma" : thread.name}
          </h1>
          <Badge tone={threadStatusTone(thread.status)}>{threadStatusLabel(thread.status)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {thread.category}
          {!thread.anonymised && thread.email ? ` · ${thread.email}` : ""}
          {thread.order_number ? ` · Sipariş ${thread.order_number}` : ""}
          {thread.order_number && !thread.order_linked ? " (eşleşen sipariş yok)" : ""}
        </p>
      </header>
      <section aria-label="Durum ve atama" className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="thread-status">Durum</label>
          <Select
            id="thread-status"
            className="w-44"
            value={thread.status}
            onChange={(e) => setStatus.mutate(e.target.value, { onError: fail })}
          >
            {THREAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {threadStatusLabel(s)}
              </option>
            ))}
          </Select>
        </div>
        <span>Atanan: {thread.assignee?.name ?? "—"}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={assign.isPending}
          onClick={() => assign.mutate(mine ? null : me.id, { onError: fail })}
        >
          {mine ? "Atamayı kaldır" : "Bana ata"}
        </Button>
        {!mine && thread.assignee && (
          <Button
            size="sm"
            variant="outline"
            disabled={assign.isPending}
            onClick={() => assign.mutate(null, { onError: fail })}
          >
            Atamayı kaldır
          </Button>
        )}
      </section>
      <MessageList
        messages={thread.messages}
        actionsFor={(m) => (m.kind === "reply" ? <ReplyControls reply={m} me={me} /> : null)}
      />
      {!thread.anonymised && <DraftBox threadId={threadId} me={me} />}
    </div>
  );
}

type Mode = "edit" | "approve-edit" | "reject" | null;

/** What `me` may do with one reply: the buttons, and the box each one opens. */
function ReplyControls({ reply, me }: { reply: ReplyOut; me: Me }) {
  const actions = replyActions(reply, me);
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const done = (text: string) => () => {
    setMode(null);
    setError(null);
    toast.success(text);
  };
  const run = { onError: (e: unknown) => setError(message(e)) };
  const edit = useContactMutation((body: string) => contactCalls.edit(reply.id, body));
  const submit = useContactMutation(() => contactCalls.submit(reply.id));
  const approve = useContactMutation((body: string | undefined) =>
    contactCalls.approve(reply.id, body),
  );
  const reject = useContactMutation((note: string) => contactCalls.reject(reply.id, note));
  if (actions.length === 0) return null;
  const open = (next: Mode, initial: string) => () => {
    setText(initial);
    setError(null);
    setMode(next);
  };
  const button = (action: ReplyAction) => {
    switch (action) {
      case "edit":
        return (
          <Button key={action} size="sm" variant="outline" onClick={open("edit", reply.body)}>
            Düzenle
          </Button>
        );
      case "submit":
        return (
          <Button
            key={action}
            size="sm"
            disabled={submit.isPending}
            onClick={() =>
              submit.mutate(undefined, { ...run, onSuccess: done("Onaya gönderildi.") })
            }
          >
            Onaya gönder
          </Button>
        );
      case "approve":
        return (
          <span key={action} className="contents">
            <Button
              size="sm"
              disabled={approve.isPending}
              onClick={() =>
                approve.mutate(undefined, { ...run, onSuccess: done("Yanıt gönderildi.") })
              }
            >
              Onayla ve gönder
            </Button>
            <Button size="sm" variant="outline" onClick={open("approve-edit", reply.body)}>
              Düzenleyip gönder
            </Button>
          </span>
        );
      case "reject":
        return (
          <Button key={action} size="sm" variant="outline" onClick={open("reject", "")}>
            Reddet
          </Button>
        );
    }
  };
  const problem = mode === "reject" ? noteError(text) : mode ? replyError(text) : null;
  const send = () => {
    if (mode === "edit") edit.mutate(text, { ...run, onSuccess: done("Taslak kaydedildi.") });
    if (mode === "approve-edit")
      approve.mutate(text, { ...run, onSuccess: done("Yanıt gönderildi.") });
    if (mode === "reject") reject.mutate(text, { ...run, onSuccess: done("Yanıt reddedildi.") });
  };
  return (
    <div className="space-y-2">
      {mode === null ? (
        <div className="flex flex-wrap gap-2">{actions.map(button)}</div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor={`reply-${reply.id}`}>
            {mode === "reject" ? "Not (Personel görür)" : "Yanıt"}
          </label>
          <Textarea
            id={`reply-${reply.id}`}
            value={text}
            maxLength={(mode === "reject" ? NOTE_MAX : REPLY_MAX) + 50}
            aria-invalid={!!problem && text.length > 0}
            onChange={(e) => setText(e.target.value)}
          />
          {problem && text.length > 0 && <p className="text-sm text-red-700">{problem}</p>}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setMode(null)}>
              Vazgeç
            </Button>
            <Button size="sm" disabled={!!problem} onClick={send}>
              {mode === "edit" ? "Kaydet" : mode === "reject" ? "Reddet" : "Gönder"}
            </Button>
          </div>
        </div>
      )}
      {mode === null && error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** A new reply. Staff save a draft to send for approval; the Owner's reply goes out at once. */
function DraftBox({ threadId, me }: { threadId: number; me: Me }) {
  const owner = canSend(me);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const write = useContactMutation((body: string) => contactCalls.write(threadId, body));
  const problem = replyError(text);
  return (
    <section aria-label="Yeni yanıt" className="space-y-2">
      <label htmlFor="new-reply" className="block text-sm font-medium">
        {owner ? "Yanıt yaz" : "Taslak yaz"}
      </label>
      <Textarea
        id="new-reply"
        value={text}
        maxLength={REPLY_MAX + 50}
        aria-invalid={!!problem && text.length > 0}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {owner
          ? "Gönder dediğinizde yanıt hemen müşteriye e-postayla gider."
          : "Taslak kaydedilir; onaya gönderdiğinizde sahip okur, onaylarsa müşteriye gider."}
      </p>
      {problem && text.length > 0 && <p className="text-sm text-red-700">{problem}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!!problem || write.isPending}
          onClick={() =>
            write.mutate(text, {
              onSuccess: () => {
                setText("");
                setError(null);
                toast.success(owner ? "Yanıt gönderildi." : "Taslak kaydedildi.");
              },
              onError: (e) => setError(message(e)),
            })
          }
        >
          {owner ? "Gönder" : "Taslağı kaydet"}
        </Button>
      </div>
    </section>
  );
}
