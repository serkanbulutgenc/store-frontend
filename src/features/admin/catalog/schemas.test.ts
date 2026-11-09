import { describe, expect, it } from "vitest";
import {
  moneySchema,
  productFormSchema,
  stockAdjustmentSchema,
  toProductBody,
  variantEditSchema,
  variantFormSchema,
} from "./schemas";

describe("moneySchema", () => {
  it("accepts decimal strings with up to two places", () => {
    for (const ok of ["0", "10", "10.5", "1299.90"])
      expect(moneySchema.safeParse(ok).success).toBe(true);
  });
  it("rejects comma, negatives, three places and letters", () => {
    for (const bad of ["10,5", "-1", "1.234", "abc", ""])
      expect(moneySchema.safeParse(bad).success).toBe(false);
  });
});

const product = {
  title: "Pamuklu Tişört",
  slug: "",
  category_id: "4",
  brand_id: "",
  product_class_id: "1",
  shelf_price: "199.90",
  old_price: "",
  cost_price: "",
  supplier_id: "",
  supplier_code: "",
  low_stock_threshold: "",
};

describe("productFormSchema", () => {
  it("requires title, category, class and price", () => {
    const r = productFormSchema.safeParse({
      ...product,
      title: "",
      category_id: "",
      shelf_price: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path[0]);
      expect(paths).toEqual(expect.arrayContaining(["title", "category_id", "shelf_price"]));
    }
  });
});

describe("toProductBody", () => {
  it("turns empty strings into null and ids into numbers", () => {
    const body = toProductBody(productFormSchema.parse(product), { cost: false, supplier: false });
    expect(body).toEqual({
      title: "Pamuklu Tişört",
      slug: null,
      category_id: 4,
      brand_id: null,
      product_class_id: 1,
      shelf_price: "199.90",
      old_price: null,
      low_stock_threshold: null,
    });
  });

  it("sends cost and supplier fields only when the user may see them (the API rejects them otherwise)", () => {
    const values = productFormSchema.parse({
      ...product,
      cost_price: "80",
      supplier_id: "2",
      supplier_code: "X1",
    });
    const staff = toProductBody(values, { cost: false, supplier: false });
    expect(staff).not.toHaveProperty("cost_price");
    expect(staff).not.toHaveProperty("supplier_id");
    const owner = toProductBody(values, { cost: true, supplier: true });
    expect(owner).toMatchObject({ cost_price: "80", supplier_id: 2, supplier_code: "X1" });
  });
});

describe("variantFormSchema", () => {
  it("needs a colour and size; sku, barcode and override are optional", () => {
    expect(
      variantFormSchema.safeParse({
        colour_id: "",
        size: "",
        sku: "",
        barcode: "",
        price_override: "",
        stock: "0",
      }).success,
    ).toBe(false);
    expect(
      variantFormSchema.safeParse({
        colour_id: "3",
        size: "M",
        sku: "",
        barcode: "",
        price_override: "",
        stock: "5",
      }).success,
    ).toBe(true);
  });
  it("rejects negative opening stock", () => {
    expect(
      variantFormSchema.safeParse({
        colour_id: "3",
        size: "M",
        sku: "",
        barcode: "",
        price_override: "",
        stock: "-1",
      }).success,
    ).toBe(false);
  });
});

describe("stockAdjustmentSchema", () => {
  it("needs a non-zero whole delta and a reason", () => {
    expect(stockAdjustmentSchema.safeParse({ delta: "0", reason: "Sayım" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ delta: "1.5", reason: "Sayım" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ delta: "-2", reason: "" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ delta: "-2", reason: "  " }).success).toBe(false);
    expect(stockAdjustmentSchema.parse({ delta: "-2", reason: "Sayım farkı" })).toEqual({
      delta: -2,
      reason: "Sayım farkı",
    });
  });
});

describe("toProductBody on edit", () => {
  it("omits a blank slug and a blank threshold instead of sending null (the API would rename to 'none' / reject)", () => {
    const body = toProductBody(
      productFormSchema.parse(product),
      { cost: false, supplier: false },
      "edit",
    );
    expect(body).not.toHaveProperty("slug");
    expect(body).not.toHaveProperty("low_stock_threshold");
  });
  it("still sends them when filled", () => {
    const v = productFormSchema.parse({ ...product, slug: "pamuklu", low_stock_threshold: "3" });
    expect(toProductBody(v, { cost: false, supplier: false }, "edit")).toMatchObject({
      slug: "pamuklu",
      low_stock_threshold: 3,
    });
  });
});

describe("variantEditSchema", () => {
  it("requires a SKU and a valid optional price", () => {
    expect(variantEditSchema.safeParse({ sku: "", barcode: "", price_override: "" }).success).toBe(
      false,
    );
    expect(
      variantEditSchema.safeParse({ sku: "A-1", barcode: "", price_override: "12,5" }).success,
    ).toBe(false);
    expect(
      variantEditSchema.safeParse({ sku: "A-1", barcode: "", price_override: "12.50" }).success,
    ).toBe(true);
  });
});

describe("stockAdjustmentSchema limits", () => {
  it("matches the server: delta within +-100000, reason up to 200 characters", () => {
    expect(stockAdjustmentSchema.safeParse({ delta: "100001", reason: "x" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ delta: "-100001", reason: "x" }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({ delta: "5", reason: "x".repeat(201) }).success).toBe(
      false,
    );
    expect(
      stockAdjustmentSchema.safeParse({ delta: "100000", reason: "x".repeat(200) }).success,
    ).toBe(true);
  });
});
