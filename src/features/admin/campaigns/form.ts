import { z } from "zod";
import type { components } from "../../../../api/specs/openapi-admin";
import { isoToShopTime, shopTimeToIso } from "../vouchers/form";

type CampaignIn = components["schemas"]["CampaignIn"];
type CampaignPatch = components["schemas"]["CampaignPatch"];
export type CampaignRow = components["schemas"]["CampaignOut"];
export type Target = components["schemas"]["TargetOut"];

const NAME_MAX = 200;

/** "12,5" becomes "12.5"; null when it is not a plain number with at most two decimals. */
function amount(raw: string): string | null {
  const v = raw.trim().replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(v) ? v : null;
}

const moment = (raw: string): number | null => {
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
};

const target = z.object({ id: z.number(), name: z.string() });

/** The form's rules, the same the API enforces: a name, 1 to 99 percent, an end after the
 * start, and at least one Product, Category or Collection. */
export const campaignFormSchema = z
  .object({
    name: z.string(),
    percentage: z.string(),
    starts_at: z.string(),
    ends_at: z.string(),
    is_active: z.boolean(),
    include_subcategories: z.boolean(),
    products: z.array(target),
    categories: z.array(target),
    collections: z.array(target),
  })
  .superRefine((v, ctx) => {
    const refuse = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    const name = v.name.trim();
    if (name === "" || name.length > NAME_MAX) {
      refuse("name", `Kampanya adı 1-${NAME_MAX} karakter olmalı.`);
    }
    const percentage = amount(v.percentage);
    const n = percentage === null ? Number.NaN : Number(percentage);
    if (!(n >= 1 && n <= 99)) refuse("percentage", "İndirim yüzdesi 1 ile 99 arasında olmalı.");
    if (v.products.length + v.categories.length + v.collections.length === 0) {
      refuse("products", "En az bir ürün, kategori veya koleksiyon seçin.");
    }
    const start = v.starts_at.trim() === "" ? null : moment(v.starts_at);
    const end = v.ends_at.trim() === "" ? null : moment(v.ends_at);
    if (v.starts_at.trim() !== "" && start === null)
      refuse("starts_at", "Geçerli bir tarih girin.");
    if (v.ends_at.trim() !== "" && end === null) refuse("ends_at", "Geçerli bir tarih girin.");
    if (start !== null && end !== null && end <= start) {
      refuse("ends_at", "Bitiş, başlangıçtan sonra olmalı.");
    }
  })
  .transform((v) => ({
    ...v,
    name: v.name.trim(),
    percentage: amount(v.percentage) ?? v.percentage.trim(),
  }));

export type CampaignForm = z.input<typeof campaignFormSchema>;
export type CampaignValues = z.output<typeof campaignFormSchema>;

const ids = (targets: Target[]) => targets.map((t) => t.id);

export function createBody(v: CampaignValues): CampaignIn {
  return {
    name: v.name,
    percentage: v.percentage,
    starts_at: shopTimeToIso(v.starts_at),
    ends_at: shopTimeToIso(v.ends_at),
    is_active: v.is_active,
    include_subcategories: v.include_subcategories,
    product_ids: ids(v.products),
    category_ids: ids(v.categories),
    collection_ids: ids(v.collections),
  };
}

/** The form's starting values: blank for a new Campaign (on, nothing targeted), the Campaign's own when editing. */
export function campaignDefaults(row?: CampaignRow): CampaignForm {
  if (!row) {
    return {
      name: "",
      percentage: "",
      starts_at: "",
      ends_at: "",
      is_active: true,
      include_subcategories: false,
      products: [],
      categories: [],
      collections: [],
    };
  }
  return {
    name: row.name,
    percentage: row.percentage,
    starts_at: row.starts_at === null ? "" : isoToShopTime(row.starts_at),
    ends_at: row.ends_at === null ? "" : isoToShopTime(row.ends_at),
    is_active: row.is_active,
    include_subcategories: row.include_subcategories,
    products: row.products,
    categories: row.categories,
    collections: row.collections,
  };
}

const sameIds = (a: Target[], b: Target[]) =>
  a.length === b.length && [...ids(a)].sort().join() === [...ids(b)].sort().join();

/** The body for editing: only what differs from the Campaign as it is. The on/off switch is
 * not here; it has its own endpoints. A cleared start or end goes as null. */
export function editBody(v: CampaignValues, row: CampaignRow): CampaignPatch {
  const was = campaignDefaults(row);
  const body: CampaignPatch = {};
  if (v.name !== was.name) body.name = v.name;
  if (Number(v.percentage) !== Number(was.percentage)) body.percentage = v.percentage;
  if (v.starts_at !== was.starts_at) body.starts_at = shopTimeToIso(v.starts_at);
  if (v.ends_at !== was.ends_at) body.ends_at = shopTimeToIso(v.ends_at);
  if (v.include_subcategories !== was.include_subcategories) {
    body.include_subcategories = v.include_subcategories;
  }
  if (!sameIds(v.products, was.products)) body.product_ids = ids(v.products);
  if (!sameIds(v.categories, was.categories)) body.category_ids = ids(v.categories);
  if (!sameIds(v.collections, was.collections)) body.collection_ids = ids(v.collections);
  return body;
}
