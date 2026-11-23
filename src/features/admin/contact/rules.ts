import { can, type Me } from "@/lib/api/me";

export const THREAD_STATUSES = ["new", "in_progress", "answered"] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  in_progress: "Devam ediyor",
  answered: "Yanıtlandı",
};

export const threadStatusLabel = (status: string) => STATUS_LABELS[status] ?? status;

export function threadStatusTone(status: string): "neutral" | "good" | "warn" {
  if (status === "new") return "warn";
  return status === "answered" ? "good" : "neutral";
}

const REPLY_LABELS: Record<string, string> = {
  draft: "Taslak",
  pending: "Onay bekliyor",
  rejected: "Reddedildi",
  sent: "Gönderildi",
};

export const replyStateLabel = (state: string) => REPLY_LABELS[state] ?? state;

export function replyStateTone(state: string): "neutral" | "good" | "warn" {
  if (state === "sent") return "good";
  return state === "pending" || state === "rejected" ? "warn" : "neutral";
}

// Limits mirror the API (REPLY_MAX, NOTE_MAX in contact_threads.py).
export const REPLY_MAX = 5000;
export const NOTE_MAX = 500;

export function replyError(text: string): string | null {
  const body = text.trim();
  if (!body) return "Yanıt boş olamaz.";
  return body.length > REPLY_MAX ? `Yanıt en fazla ${REPLY_MAX} karakter olabilir.` : null;
}

export function noteError(text: string): string | null {
  return text.trim().length > NOTE_MAX ? `Not en fazla ${NOTE_MAX} karakter olabilir.` : null;
}

/** Only the Owner sends: Staff write drafts. UX only; the API checks `manage_contact` itself. */
export const canSend = (me: Me | null) => can(me, "manage_contact");

type ReplyLike = { state: string; author: { id: number } | null };

export type ReplyAction = "edit" | "submit" | "approve" | "reject";

/**
 * What `me` may do with a reply, in the order the buttons appear. A draft or a rejected reply
 * is edited by its author or the Owner and submitted by its author; only the Owner decides on
 * a waiting one. A sent reply has no actions.
 */
export function replyActions(reply: ReplyLike, me: Me): ReplyAction[] {
  const owner = canSend(me);
  const mine = reply.author?.id === me.id;
  if (reply.state === "draft" || reply.state === "rejected") {
    return [...(mine || owner ? (["edit"] as const) : []), ...(mine ? (["submit"] as const) : [])];
  }
  return reply.state === "pending" && owner ? ["approve", "reject"] : [];
}

/** What the Owner reads above a thread's waiting reply. */
export const waitingText = (count: number) =>
  count === 0 ? "" : count === 1 ? "1 yanıt onay bekliyor" : `${count} yanıt onay bekliyor`;
