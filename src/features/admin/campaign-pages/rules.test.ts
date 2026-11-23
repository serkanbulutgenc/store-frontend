import { describe, expect, it } from "vitest";
import {
  availableActions,
  changedFields,
  checkFields,
  editNote,
  editTarget,
  fromLocalInput,
  imageEditable,
  type PageState,
  pendingKind,
  toLocalInput,
} from "./rules";

const staff = { owner: false, submitter: false };
const submitter = { owner: false, submitter: true };
const owner = { owner: true, submitter: false };
const s = (status: PageState["status"], hasPendingChange = false): PageState => ({
  status,
  hasPendingChange,
});
const names = (state: PageState, who: typeof staff) =>
  availableActions(state, who).map((a) => a.action);

describe("availableActions", () => {
  it("lets Staff submit a draft but not publish it; the Owner publishes straight away", () => {
    expect(names(s("draft"), staff)).toEqual(["submit"]);
    expect(names(s("draft"), owner)).toEqual(["publish"]);
  });

  it("lets only the submitter withdraw, and only the Owner approve or reject", () => {
    expect(names(s("pending_approval"), staff)).toEqual([]);
    expect(names(s("pending_approval"), submitter)).toEqual(["withdraw"]);
    expect(names(s("pending_approval"), owner)).toEqual(["approve", "reject"]);
  });

  it("offers unpublish on a live page, but approve and reject while a change is pending", () => {
    expect(names(s("published"), owner)).toEqual(["unpublish"]);
    expect(names(s("published", true), owner)).toEqual(["approve", "reject"]);
    expect(names(s("published"), staff)).toEqual([]);
  });

  it("lets only the Owner publish an unpublished page again", () => {
    expect(names(s("unpublished"), owner)).toEqual(["publish"]);
    expect(names(s("unpublished"), staff)).toEqual([]);
  });
});

describe("editTarget", () => {
  it("sends Staff edits of a live page to the pending change", () => {
    expect(editTarget(s("published"), staff)).toBe("pending-change");
    expect(editTarget(s("draft"), staff)).toBe("page");
  });

  it("refuses Staff on a pending or unpublished page", () => {
    expect(editTarget(s("pending_approval"), staff)).toBe("none");
    expect(editTarget(s("unpublished"), staff)).toBe("none");
  });

  it("lets the Owner edit anything except a live page with a pending change", () => {
    expect(editTarget(s("published"), owner)).toBe("page");
    expect(editTarget(s("published", true), owner)).toBe("none");
    expect(editNote(s("published", true), owner)).toContain("onaylayın veya reddedin");
  });
});

describe("imageEditable", () => {
  it("is the Owner's any time and Staff's on a draft only", () => {
    expect(imageEditable(s("published"), owner)).toBe(true);
    expect(imageEditable(s("draft"), staff)).toBe(true);
    expect(imageEditable(s("published"), staff)).toBe(false);
  });
});

describe("pendingKind", () => {
  it("names what the Owner has to decide", () => {
    expect(pendingKind(s("pending_approval"))).toBe("submission");
    expect(pendingKind(s("published", true))).toBe("change");
    expect(pendingKind(s("published"))).toBeNull();
  });
});

describe("dates", () => {
  it("round-trips a moment through the datetime-local value", () => {
    const iso = "2026-07-01T09:30:00.000Z";
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });

  it("treats empty and unreadable values as no date", () => {
    expect(toLocalInput(null)).toBe("");
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("nonsense")).toBeNull();
  });
});

describe("checkFields", () => {
  const ok = { title: "Yaz", description: "", starts: "", ends: "" };

  it("passes a title alone", () => {
    expect(checkFields(ok)).toEqual({});
  });

  it("needs a title and bounds the text", () => {
    expect(checkFields({ ...ok, title: " " }).title).toBe("Başlık gerekli.");
    expect(checkFields({ ...ok, description: "x".repeat(20_001) }).description).toContain("20000");
  });

  it("wants the end after the start", () => {
    expect(checkFields({ ...ok, starts: "2026-07-02T10:00", ends: "2026-07-01T10:00" }).ends).toBe(
      "Bitiş tarihi başlangıçtan sonra olmalı.",
    );
    expect(checkFields({ ...ok, starts: "2026-07-01T10:00", ends: "2026-07-02T10:00" })).toEqual(
      {},
    );
  });
});

describe("changedFields", () => {
  const live = {
    title: "A",
    slug: "a",
    description: "x",
    starts_at: null,
    ends_at: null,
  };

  it("lists only what the change differs on", () => {
    const rows = changedFields(live, { title: "B", slug: "a", description: "x" });
    expect(rows.map((r) => [r.field, r.before, r.after])).toEqual([["title", "A", "B"]]);
  });

  it("sees a date being cleared or set", () => {
    const rows = changedFields(
      { ...live, ends_at: "2026-07-01T00:00:00Z" },
      { ends_at: null, starts_at: "2026-06-01T00:00:00Z" },
    );
    expect(rows.map((r) => r.field).sort()).toEqual(["ends_at", "starts_at"]);
  });
});
