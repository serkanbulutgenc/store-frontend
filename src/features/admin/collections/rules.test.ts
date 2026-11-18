import { describe, expect, it } from "vitest";
import {
  availableActions,
  type CollectionState,
  collectionStatusLabel,
  EMPTY_WARNING,
  editNote,
  editTarget,
  emptyWarning,
  imageEditable,
  move,
  pendingKind,
} from "./rules";

const OWNER = { owner: true, submitter: false };
const STAFF = { owner: false, submitter: false };
const SUBMITTER = { owner: false, submitter: true };
const state = (status: CollectionState["status"], hasPendingChange = false): CollectionState => ({
  status,
  hasPendingChange,
});
const names = (s: CollectionState, who: typeof OWNER) =>
  availableActions(s, who).map((a) => a.action);

describe("availableActions", () => {
  it("lets Staff submit a draft and the Owner publish it", () => {
    expect(names(state("draft"), STAFF)).toEqual(["submit"]);
    expect(names(state("draft"), OWNER)).toEqual(["publish"]);
  });
  it("lets the Owner approve or reject a pending Collection, and its submitter withdraw it", () => {
    expect(names(state("pending_approval"), OWNER)).toEqual(["approve", "reject"]);
    expect(names(state("pending_approval"), SUBMITTER)).toEqual(["withdraw"]);
    expect(names(state("pending_approval"), STAFF)).toEqual([]);
  });
  it("lets the Owner unpublish, but only approve or reject while a change is pending", () => {
    expect(names(state("published"), OWNER)).toEqual(["unpublish"]);
    expect(names(state("published", true), OWNER)).toEqual(["approve", "reject"]);
    expect(names(state("published"), STAFF)).toEqual([]);
  });
  it("lets only the Owner publish an unpublished Collection again", () => {
    expect(names(state("unpublished"), OWNER)).toEqual(["publish"]);
    expect(names(state("unpublished"), STAFF)).toEqual([]);
  });
});

describe("editTarget", () => {
  it("sends the Owner's save to the pending change when one exists", () => {
    expect(editTarget(state("published", true), OWNER)).toBe("pending-change");
    expect(editTarget(state("published"), OWNER)).toBe("collection");
    expect(editTarget(state("unpublished"), OWNER)).toBe("collection");
  });
  it("lets Staff edit a draft directly and a published one as a pending change", () => {
    expect(editTarget(state("draft"), STAFF)).toBe("collection");
    expect(editTarget(state("published"), STAFF)).toBe("pending-change");
    expect(editTarget(state("pending_approval"), STAFF)).toBe("none");
    expect(editTarget(state("unpublished"), STAFF)).toBe("none");
  });
  it("explains what Staff cannot or will do", () => {
    expect(editNote(state("published"), STAFF)).toMatch(/onayına gider/);
    expect(editNote(state("pending_approval"), STAFF)).toMatch(/geri çekin/);
    expect(editNote(state("unpublished"), STAFF)).toMatch(/yalnızca sahip/);
    expect(editNote(state("draft"), STAFF)).toBeNull();
    expect(editNote(state("published"), OWNER)).toBeNull();
  });
});

describe("imageEditable", () => {
  it("lets the Owner change it except on a published Collection with a pending change", () => {
    expect(imageEditable(state("published"), OWNER)).toBe(true);
    expect(imageEditable(state("unpublished"), OWNER)).toBe(true);
    expect(imageEditable(state("published", true), OWNER)).toBe(false);
  });
  it("lets Staff change it on a draft only", () => {
    expect(imageEditable(state("draft"), STAFF)).toBe(true);
    for (const s of ["pending_approval", "published", "unpublished"] as const)
      expect(imageEditable(state(s), STAFF)).toBe(false);
  });
});

describe("move", () => {
  it("moves an item one place and keeps the ends in place", () => {
    expect(move([1, 2, 3], 1, -1)).toEqual([2, 1, 3]);
    expect(move([1, 2, 3], 1, 1)).toEqual([1, 3, 2]);
    expect(move([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(move([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
  });
  it("does not change its input", () => {
    const list = [1, 2];
    move(list, 0, 1);
    expect(list).toEqual([1, 2]);
  });
});

it("names every status in Turkish", () => {
  expect(collectionStatusLabel("pending_approval")).toBe("Onay bekliyor");
  expect(collectionStatusLabel("other")).toBe("other");
});

describe("emptyWarning", () => {
  const publish = [{ action: "publish" as const }];
  const published = { status: "published" };
  const draft = { status: "draft" };
  it("warns when publishing or approving a version with no published Product", () => {
    expect(emptyWarning(publish, [])).toBe(EMPTY_WARNING);
    expect(emptyWarning(publish, [draft, { status: "archived" }])).toBe(EMPTY_WARNING);
    expect(emptyWarning([{ action: "approve" }], [draft])).toBe(EMPTY_WARNING);
  });
  it("stays quiet with one visible Product, or when nothing goes live", () => {
    expect(emptyWarning(publish, [draft, published])).toBeNull();
    expect(emptyWarning([{ action: "unpublish" }], [])).toBeNull();
    expect(emptyWarning([{ action: "submit" }], [])).toBeNull();
    expect(emptyWarning([], [])).toBeNull();
  });
});

describe("pendingKind", () => {
  it("is a submission while awaiting approval", () => {
    expect(pendingKind({ status: "pending_approval", hasPendingChange: false })).toBe("submission");
  });
  it("is a change on a published Collection with one", () => {
    expect(pendingKind({ status: "published", hasPendingChange: true })).toBe("change");
  });
  it("is nothing otherwise", () => {
    expect(pendingKind({ status: "published", hasPendingChange: false })).toBeNull();
    expect(pendingKind({ status: "draft", hasPendingChange: false })).toBeNull();
    expect(pendingKind({ status: "unpublished", hasPendingChange: false })).toBeNull();
  });
});
