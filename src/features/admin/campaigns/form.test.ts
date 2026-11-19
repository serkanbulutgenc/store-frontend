import { describe, expect, it } from "vitest";
import {
  activationChange,
  type CampaignForm,
  type CampaignRow,
  campaignDefaults,
  campaignFormSchema,
  createBody,
  editBody,
} from "./form";

const target = (id: number, name = `Hedef ${id}`) => ({ id, name });
const valid: CampaignForm = {
  name: "Kara Cuma",
  percentage: "20",
  starts_at: "",
  ends_at: "",
  is_active: true,
  include_subcategories: false,
  products: [target(1)],
  categories: [],
  collections: [],
};
const issues = (over: Partial<CampaignForm>) => {
  const r = campaignFormSchema.safeParse({ ...valid, ...over });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
};

describe("campaignFormSchema", () => {
  it("accepts a named Campaign with a percentage and one target", () => {
    expect(issues({})).toEqual({});
  });

  it("needs a name of at most 200 characters", () => {
    expect(issues({ name: "  " }).name).toBeTruthy();
    expect(issues({ name: "a".repeat(201) }).name).toBeTruthy();
    expect(issues({ name: "a".repeat(200) })).toEqual({});
  });

  it("takes a percentage from 1 to 99, with a comma or a dot", () => {
    for (const bad of ["", "0", "0,99", "100", "99,01", "abc", "-5"]) {
      expect(issues({ percentage: bad }).percentage, bad).toBeTruthy();
    }
    for (const good of ["1", "99", "12,5", "12.5", " 20 "]) {
      expect(issues({ percentage: good }).percentage, good).toBeUndefined();
    }
  });

  it("needs at least one Product, Category or Collection", () => {
    expect(issues({ products: [] }).products).toBeTruthy();
    expect(issues({ products: [], categories: [target(2)] })).toEqual({});
    expect(issues({ products: [], collections: [target(3)] })).toEqual({});
  });

  it("wants the end after the start, and leaves either open", () => {
    expect(
      issues({ starts_at: "2026-11-20T10:00", ends_at: "2026-11-20T10:00" }).ends_at,
    ).toBeTruthy();
    expect(
      issues({ starts_at: "2026-11-21T10:00", ends_at: "2026-11-20T10:00" }).ends_at,
    ).toBeTruthy();
    expect(issues({ starts_at: "2026-11-20T10:00", ends_at: "2026-11-21T10:00" })).toEqual({});
    expect(issues({ starts_at: "2026-11-20T10:00" })).toEqual({});
    expect(issues({ ends_at: "2026-11-21T10:00" })).toEqual({});
  });
});

describe("createBody", () => {
  it("sends ids, a dotted percentage, shop-time schedule and the switch", () => {
    const body = createBody(
      campaignFormSchema.parse({
        ...valid,
        name: "  Kara Cuma ",
        percentage: "12,5",
        starts_at: "2026-11-20T10:00",
        include_subcategories: true,
        products: [target(4), target(5)],
        categories: [target(7)],
        is_active: false,
      }),
    );
    expect(body).toEqual({
      name: "Kara Cuma",
      percentage: "12.5",
      starts_at: "2026-11-20T10:00:00+03:00",
      ends_at: null,
      is_active: false,
      include_subcategories: true,
      product_ids: [4, 5],
      category_ids: [7],
      collection_ids: [],
    });
  });
});

const row: CampaignRow = {
  id: 9,
  name: "Kara Cuma",
  percentage: "20.00",
  starts_at: "2026-11-20T07:00:00Z",
  ends_at: null,
  is_active: true,
  status: "active",
  include_subcategories: false,
  products: [target(1)],
  categories: [],
  collections: [],
  affected_products: 1,
  below_cost: [],
};

describe("editing", () => {
  it("starts from the Campaign as it is, in shop time", () => {
    expect(campaignDefaults(row)).toEqual({
      name: "Kara Cuma",
      percentage: "20.00",
      starts_at: "2026-11-20T10:00",
      ends_at: "",
      is_active: true,
      include_subcategories: false,
      products: [target(1)],
      categories: [],
      collections: [],
    });
  });

  it("sends nothing when nothing changed", () => {
    expect(editBody(campaignFormSchema.parse(campaignDefaults(row)), row)).toEqual({});
  });

  it("sends only what changed; 20 is the same percentage as 20.00", () => {
    const values = campaignFormSchema.parse({
      ...campaignDefaults(row),
      name: "Yeni ad",
      percentage: "20",
      categories: [target(2)],
    });
    expect(editBody(values, row)).toEqual({ name: "Yeni ad", category_ids: [2] });
  });

  it("clears a start by sending null, and sets a new percentage", () => {
    const values = campaignFormSchema.parse({
      ...campaignDefaults(row),
      percentage: "25",
      starts_at: "",
    });
    expect(editBody(values, row)).toEqual({ percentage: "25", starts_at: null });
  });
});

describe("activationChange", () => {
  const values = (is_active: boolean) =>
    campaignFormSchema.parse({ ...campaignDefaults(row), is_active });

  it("is nothing while the switch stays where the Campaign has it", () => {
    expect(activationChange(values(true), row)).toBeNull();
    expect(activationChange(values(false), { ...row, is_active: false })).toBeNull();
  });

  it("closes a Campaign whose switch was turned off, and opens one turned on", () => {
    expect(activationChange(values(false), row)).toBe("deactivate");
    expect(activationChange(values(true), { ...row, is_active: false })).toBe("activate");
  });
});
