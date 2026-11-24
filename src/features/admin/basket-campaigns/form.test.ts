import { describe, expect, it } from "vitest";
import {
  activationChange,
  type BasketCampaignForm,
  basketCampaignDefaults,
  basketCampaignFormSchema,
  createBody,
  editBody,
} from "./form";
import type { BasketCampaignRow } from "./rules";

const valid: BasketCampaignForm = {
  name: "Hafta sonu",
  minimum_amount: "500",
  benefit: "fixed",
  value: "50",
  starts_at: "",
  ends_at: "",
  is_active: true,
};
const issues = (over: Partial<BasketCampaignForm>) => {
  const r = basketCampaignFormSchema.safeParse({ ...valid, ...over });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
};

describe("basketCampaignFormSchema", () => {
  it("accepts a named rule with a minimum and a TL amount below it", () => {
    expect(issues({})).toEqual({});
  });

  it("needs a name of at most 200 characters", () => {
    expect(issues({ name: " " }).name).toBeTruthy();
    expect(issues({ name: "a".repeat(201) }).name).toBeTruthy();
  });

  it("needs a minimum above zero, with a comma or a dot", () => {
    for (const bad of ["", "0", "-5", "abc"]) {
      expect(issues({ minimum_amount: bad }).minimum_amount, bad).toBeTruthy();
    }
    expect(issues({ minimum_amount: "1250,50" }).minimum_amount).toBeUndefined();
  });

  it("wants a TL amount above zero and below the minimum", () => {
    for (const bad of ["", "0", "500", "600"]) {
      expect(issues({ value: bad }).value, bad).toBeTruthy();
    }
    expect(issues({ value: "499,99" }).value).toBeUndefined();
  });

  it("wants 1 to 99 percent for a percentage, whatever the minimum", () => {
    for (const bad of ["", "0", "100", "abc"]) {
      expect(issues({ benefit: "percentage", value: bad }).value, bad).toBeTruthy();
    }
    expect(issues({ benefit: "percentage", value: "99", minimum_amount: "10" })).toEqual({});
  });

  it("takes no amount for free shipping", () => {
    expect(issues({ benefit: "free_shipping", value: "" })).toEqual({});
    expect(issues({ benefit: "free_shipping", value: "garbage" })).toEqual({});
  });

  it("wants the end after the start", () => {
    expect(
      issues({ starts_at: "2026-11-21T10:00", ends_at: "2026-11-20T10:00" }).ends_at,
    ).toBeTruthy();
    expect(issues({ starts_at: "2026-11-20T10:00", ends_at: "2026-11-21T10:00" })).toEqual({});
  });
});

describe("createBody", () => {
  it("sends dotted amounts, the shop-time schedule and the switch", () => {
    const body = createBody(
      basketCampaignFormSchema.parse({
        ...valid,
        name: " Hafta sonu ",
        minimum_amount: "1250,5",
        value: "12,5",
        starts_at: "2026-11-20T10:00",
        is_active: false,
      }),
    );
    expect(body).toEqual({
      name: "Hafta sonu",
      minimum_amount: "1250.5",
      benefit: "fixed",
      value: "12.5",
      starts_at: "2026-11-20T10:00:00+03:00",
      ends_at: null,
      is_active: false,
    });
  });

  it("sends no value for free shipping", () => {
    const body = createBody(
      basketCampaignFormSchema.parse({ ...valid, benefit: "free_shipping", value: "50" }),
    );
    expect(body).toMatchObject({ benefit: "free_shipping", value: null });
  });
});

const row: BasketCampaignRow = {
  id: 4,
  name: "Hafta sonu",
  label: "500 ₺ üzeri 50 ₺ indirim",
  minimum_amount: "500.00",
  benefit: "fixed",
  value: "50.00",
  starts_at: "2026-11-20T07:00:00Z",
  ends_at: null,
  is_active: true,
  status: "active",
  orders: 0,
};

describe("editing", () => {
  it("starts from the Campaign as it is, in shop time", () => {
    expect(basketCampaignDefaults(row)).toEqual({
      name: "Hafta sonu",
      minimum_amount: "500.00",
      benefit: "fixed",
      value: "50.00",
      starts_at: "2026-11-20T10:00",
      ends_at: "",
      is_active: true,
    });
  });

  it("sends nothing when nothing changed; 50 is the same amount as 50.00", () => {
    expect(
      editBody(
        basketCampaignFormSchema.parse({ ...basketCampaignDefaults(row), value: "50" }),
        row,
      ),
    ).toEqual({});
  });

  it("sends only what changed", () => {
    const values = basketCampaignFormSchema.parse({
      ...basketCampaignDefaults(row),
      minimum_amount: "300",
      value: "30",
    });
    expect(editBody(values, row)).toEqual({ minimum_amount: "300", value: "30" });
  });

  it("sends the value with a changed benefit, and null for free shipping", () => {
    const toPercent = basketCampaignFormSchema.parse({
      ...basketCampaignDefaults(row),
      benefit: "percentage",
      value: "10",
    });
    expect(editBody(toPercent, row)).toEqual({ benefit: "percentage", value: "10" });
    const toFree = basketCampaignFormSchema.parse({
      ...basketCampaignDefaults(row),
      benefit: "free_shipping",
    });
    expect(editBody(toFree, row)).toEqual({ benefit: "free_shipping", value: null });
  });

  it("clears the value of a Campaign that was free shipping when it is switched back", () => {
    const free: BasketCampaignRow = { ...row, benefit: "free_shipping", value: null };
    const back = basketCampaignFormSchema.parse({
      ...basketCampaignDefaults(free),
      benefit: "fixed",
      value: "40",
    });
    expect(editBody(back, free)).toEqual({ benefit: "fixed", value: "40" });
  });

  it("names the endpoint when the on/off switch moved", () => {
    const off = basketCampaignFormSchema.parse({
      ...basketCampaignDefaults(row),
      is_active: false,
    });
    expect(activationChange(off, row)).toBe("deactivate");
    expect(
      activationChange(basketCampaignFormSchema.parse(basketCampaignDefaults(row)), row),
    ).toBeNull();
  });
});
