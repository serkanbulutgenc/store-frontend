import { describe, expect, it } from "vitest";
import {
  createBody,
  editBody,
  type VoucherRow,
  voucherCapHint,
  voucherDefaults,
  voucherFormSchema,
  voucherFormSchemaFor,
  voucherLocks,
} from "./form";

const valid = {
  code: "yaz10",
  kind: "percentage",
  value: "10",
  minimum: "",
  cap: "",
  starts_at: "",
  ends_at: "",
  once_per_customer: false,
};

/** The fields a form value is refused on, as the API would name them. */
function refusedOn(change: Record<string, unknown>): string[] {
  const result = voucherFormSchema.safeParse({ ...valid, ...change });
  return result.success ? [] : [...new Set(result.error.issues.map((i) => String(i.path[0])))];
}

describe("voucherFormSchema", () => {
  it("accepts a valid voucher and tidies the code and decimal commas", () => {
    expect(voucherFormSchema.parse({ ...valid, code: "  yaz-10 " }).code).toBe("YAZ-10");
    const fixed = voucherFormSchema.parse({
      ...valid,
      kind: "fixed",
      value: "50,5",
      minimum: "250,00",
      cap: " 100 ",
    });
    expect([fixed.value, fixed.minimum, fixed.cap]).toEqual(["50.5", "250.00", "100"]);
  });

  it("refuses a code that is not 3 to 20 plain capitals, digits or hyphens", () => {
    for (const code of ["YAZ 10", "İNDİRİM", "AB", "A".repeat(21), "   ", "YAZ_10"]) {
      expect(refusedOn({ code }), code).toEqual(["code"]);
    }
    expect(refusedOn({ code: "ABC" })).toEqual([]);
    expect(refusedOn({ code: "A".repeat(20) })).toEqual([]);
  });

  it("takes a percentage from 1 to 100 and a fixed amount above nothing", () => {
    for (const value of ["0", "100.01", "-5", "", "abc", "10,555"]) {
      expect(refusedOn({ value }), value).toEqual(["value"]);
    }
    for (const value of ["0", "-1", "0,00"]) {
      expect(refusedOn({ kind: "fixed", value }), value).toEqual(["value"]);
    }
    expect(refusedOn({ value: "100" })).toEqual([]);
    expect(refusedOn({ value: "1" })).toEqual([]);
    expect(refusedOn({ kind: "fixed", value: "0,01" })).toEqual([]);
    expect(refusedOn({ kind: "fixed", value: "100.01" })).toEqual([]);
  });

  it("lets the minimum and the cap stay empty, otherwise needs 0 or more and a whole 1 or more", () => {
    expect(refusedOn({ minimum: "0" })).toEqual([]);
    expect(refusedOn({ cap: "1" })).toEqual([]);
    for (const minimum of ["-0,01", "abc", "1,234"]) {
      expect(refusedOn({ minimum }), minimum).toEqual(["minimum"]);
    }
    for (const cap of ["0", "-3", "1,5", "abc"]) {
      expect(refusedOn({ cap }), cap).toEqual(["cap"]);
    }
  });

  it("needs an end after the start; an empty end is no expiry and an empty start is now", () => {
    const at = (starts_at: string, ends_at: string) => refusedOn({ starts_at, ends_at });
    expect(at("2026-06-01T10:00", "2026-06-01T10:01")).toEqual([]);
    expect(at("2026-06-01T10:00", "")).toEqual([]);
    expect(at("", "2026-06-01T10:00")).toEqual([]);
    expect(at("", "")).toEqual([]);
    expect(at("2026-06-01T10:00", "2026-05-01T10:00")).toEqual(["ends_at"]);
    expect(at("2026-06-01T10:00", "2026-06-01T10:00")).toEqual(["ends_at"]); // not "after"
    expect(at("2026-06-01T10:00", "2026-06-01T09:59")).toEqual(["ends_at"]);
    expect(at("not a date", "")).toEqual(["starts_at"]);
    expect(at("", "2026-13-45T99:99")).toEqual(["ends_at"]);
  });
});

describe("createBody", () => {
  const body = (change: Record<string, unknown>) =>
    createBody(voucherFormSchema.parse({ ...valid, ...change }));

  it("leaves empty limits out as null and sends the plain choices as they are", () => {
    expect(body({ code: " yaz10 " })).toEqual({
      code: "YAZ10",
      kind: "percentage",
      value: "10",
      minimum: null,
      cap: null,
      starts_at: null,
      ends_at: null,
      once_per_customer: false,
    });
  });

  it("sends a cap as a number, money as text and dates as shop time with its offset", () => {
    expect(
      body({
        kind: "fixed",
        value: "50,5",
        minimum: "250",
        cap: "100",
        starts_at: "2026-06-01T10:00",
        ends_at: "2026-12-31T23:59:30",
        once_per_customer: true,
      }),
    ).toEqual({
      code: "YAZ10",
      kind: "fixed",
      value: "50.5",
      minimum: "250",
      cap: 100,
      starts_at: "2026-06-01T10:00:00+03:00",
      ends_at: "2026-12-31T23:59:30+03:00",
      once_per_customer: true,
    });
  });
});

const row: VoucherRow = {
  id: 7,
  code: "KIS50",
  kind: "fixed",
  value: "50.00",
  minimum: "250.00",
  cap: 100,
  starts_at: "2026-01-01T00:00:00Z",
  ends_at: "2999-01-01T00:00:00Z",
  once_per_customer: true,
  redemptions: 0,
  status: "active",
};

describe("voucherDefaults", () => {
  it("starts a new voucher blank, as a percentage with the switch off", () => {
    expect(voucherDefaults()).toEqual({
      code: "",
      kind: "percentage",
      value: "",
      minimum: "",
      cap: "",
      starts_at: "",
      ends_at: "",
      once_per_customer: false,
    });
  });

  it("fills the form from a voucher, showing its times in shop time", () => {
    expect(voucherDefaults(row)).toEqual({
      code: "KIS50",
      kind: "fixed",
      value: "50.00",
      minimum: "250.00",
      cap: "100",
      starts_at: "2026-01-01T03:00",
      ends_at: "2999-01-01T03:00",
      once_per_customer: true,
    });
  });

  it("shows no minimum, no cap and no expiry as empty, and a late evening on the next day", () => {
    const open = voucherDefaults({
      ...row,
      minimum: null,
      cap: null,
      ends_at: null,
      starts_at: "2026-06-30T21:30:15.123456Z",
    });
    expect([open.minimum, open.cap, open.ends_at]).toEqual(["", "", ""]);
    expect(open.starts_at).toBe("2026-07-01T00:30");
  });

  it("gives values the schema accepts back unchanged", () => {
    expect(voucherFormSchema.safeParse(voucherDefaults(row)).success).toBe(true);
  });
});

describe("editBody", () => {
  const diff = (change: Record<string, unknown>) =>
    editBody(voucherFormSchema.parse({ ...voucherDefaults(row), ...change }), row);

  it("is empty when nothing was changed, even if typed another way", () => {
    expect(diff({})).toEqual({});
    expect(diff({ code: " kis50 ", value: "50", minimum: "250,00", cap: " 100" })).toEqual({});
  });

  it("sends only what changed", () => {
    expect(diff({ value: "55,5" })).toEqual({ value: "55.5" });
    expect(diff({ minimum: "300" })).toEqual({ minimum: "300" });
    expect(diff({ cap: "150" })).toEqual({ cap: 150 });
    expect(diff({ code: "yeni50" })).toEqual({ code: "YENI50" });
    expect(diff({ once_per_customer: false })).toEqual({ once_per_customer: false });
    expect(diff({ starts_at: "2026-02-01T10:00" })).toEqual({
      starts_at: "2026-02-01T10:00:00+03:00",
    });
    expect(diff({ ends_at: "2999-06-01T10:00" })).toEqual({
      ends_at: "2999-06-01T10:00:00+03:00",
    });
  });

  it("sends null to clear the minimum, the cap or the end", () => {
    expect(diff({ minimum: "" })).toEqual({ minimum: null });
    expect(diff({ cap: "" })).toEqual({ cap: null });
    expect(diff({ ends_at: "" })).toEqual({ ends_at: null });
  });

  it("leaves a cleared start alone, because a voucher always has one", () => {
    expect(diff({ starts_at: "" })).toEqual({});
  });
});

describe("after the first redemption", () => {
  const used = { ...row, redemptions: 3 };

  it("locks the code and the once-per-Customer switch, and only then", () => {
    expect(voucherLocks(row)).toEqual({});
    expect(voucherLocks(used)).toEqual({
      code: "Kupon kullanıldığı için değiştirilemez.",
      once_per_customer: "Kupon kullanıldığı için değiştirilemez.",
    });
    expect(voucherLocks({ ...row, redemptions: 1 })).not.toEqual({});
  });

  it("tells the Owner why the cap cannot go lower", () => {
    expect(voucherCapHint(row)).toBeUndefined();
    expect(voucherCapHint(used)).toBe("Şimdiye kadar 3 kez kullanıldı; sınır bundan az olamaz.");
  });

  it("refuses a cap below the redemptions so far, naming the cap", () => {
    const refuses = (redemptions: number, cap: string) => {
      const result = voucherFormSchemaFor(redemptions).safeParse({ ...valid, cap });
      return result.success ? [] : result.error.issues.map((i) => String(i.path[0]));
    };
    expect(refuses(3, "2")).toEqual(["cap"]);
    expect(refuses(3, "3")).toEqual([]);
    expect(refuses(3, "")).toEqual([]);
    expect(refuses(0, "1")).toEqual([]);
    expect(refuses(3, "0")).toEqual(["cap"]); // refused once, not twice
  });
});
