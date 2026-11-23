import { describe, expect, it } from "vitest";
import { contactSearchSchema } from "./search";

describe("contactSearchSchema", () => {
  it("defaults to page 1 and no filters", () => {
    expect(contactSearchSchema.parse({})).toMatchObject({ page: 1, size: 25 });
  });

  it("keeps good filters", () => {
    const s = contactSearchSchema.parse({
      status: "new",
      category: "3",
      pending: "true",
      mine: true,
      from: "2026-11-01",
      to: "2026-11-30",
      q: "kargo",
    });
    expect(s).toMatchObject({
      status: "new",
      category: 3,
      pending: true,
      mine: true,
      from: "2026-11-01",
      to: "2026-11-30",
      q: "kargo",
    });
  });

  it("drops a value the API would refuse", () => {
    const s = contactSearchSchema.parse({ status: "bogus", category: "x", from: "yesterday" });
    expect(s.status).toBeUndefined();
    expect(s.category).toBeUndefined();
    expect(s.from).toBeUndefined();
  });
});
