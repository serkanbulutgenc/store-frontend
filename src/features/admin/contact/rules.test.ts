import { describe, expect, it } from "vitest";
import type { Me } from "@/lib/api/me";
import {
  canSend,
  NOTE_MAX,
  noteError,
  REPLY_MAX,
  replyActions,
  replyError,
  threadStatusTone,
  waitingText,
} from "./rules";

const staff: Me = {
  id: 2,
  email: "s@x.com",
  name: "Staff",
  role: "staff",
  permissions: ["edit_contact"],
  mfa_required: false,
  mfa_enrolled: false,
};
const owner: Me = {
  ...staff,
  id: 1,
  role: "owner",
  permissions: ["edit_contact", "manage_contact"],
};
const reply = (state: string, authorId: number | null = 2) => ({
  state,
  author: authorId === null ? null : { id: authorId },
});

describe("replyActions", () => {
  it("lets the author edit and submit a draft, and the Owner edit it", () => {
    expect(replyActions(reply("draft"), staff)).toEqual(["edit", "submit"]);
    expect(replyActions(reply("draft"), owner)).toEqual(["edit"]);
  });

  it("gives Staff nothing on another's draft", () => {
    expect(replyActions(reply("draft", 9), staff)).toEqual([]);
  });

  it("lets the author revise a rejected reply and submit it again", () => {
    expect(replyActions(reply("rejected"), staff)).toEqual(["edit", "submit"]);
  });

  it("lets only the Owner decide on a waiting reply", () => {
    expect(replyActions(reply("pending"), owner)).toEqual(["approve", "reject"]);
    expect(replyActions(reply("pending"), staff)).toEqual([]);
  });

  it("has nothing for a sent reply", () => {
    expect(replyActions(reply("sent"), owner)).toEqual([]);
  });
});

describe("canSend", () => {
  it("is the Owner's alone", () => {
    expect(canSend(owner)).toBe(true);
    expect(canSend(staff)).toBe(false);
    expect(canSend(null)).toBe(false);
  });
});

describe("limits", () => {
  it("refuses an empty or too long reply", () => {
    expect(replyError("  ")).not.toBeNull();
    expect(replyError("a".repeat(REPLY_MAX + 1))).not.toBeNull();
    expect(replyError("Merhaba")).toBeNull();
  });

  it("allows an empty note but not a long one", () => {
    expect(noteError("")).toBeNull();
    expect(noteError("a".repeat(NOTE_MAX + 1))).not.toBeNull();
  });
});

describe("labels", () => {
  it("flags a new thread and says how many replies wait", () => {
    expect(threadStatusTone("new")).toBe("warn");
    expect(threadStatusTone("answered")).toBe("good");
    expect(waitingText(0)).toBe("");
    expect(waitingText(1)).toBe("1 yanıt onay bekliyor");
    expect(waitingText(3)).toBe("3 yanıt onay bekliyor");
  });
});
