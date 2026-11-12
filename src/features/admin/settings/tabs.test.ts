import { expect, it } from "vitest";
import { settingsFormSchema } from "./schemas";
import { SETTINGS_TABS, tabsWithErrors } from "./tabs";

it("lists every form field in exactly one tab", () => {
  const listed = SETTINGS_TABS.flatMap((t) => t.fields.map((f) => f.name)).sort();
  expect(listed).toEqual(Object.keys(settingsFormSchema.shape).sort());
});

it("marks only the tabs that hold an invalid field", () => {
  const invalid = new Set(["cod_fee", "seller_email"]);
  expect(tabsWithErrors(SETTINGS_TABS, (f) => invalid.has(f))).toEqual(
    new Set(["shipping", "seller"]),
  );
  expect(tabsWithErrors(SETTINGS_TABS, () => false).size).toBe(0);
});

it("keeps the read-only legal versions on their own tab", () => {
  expect(SETTINGS_TABS.at(-1)).toMatchObject({ id: "legal", fields: [] });
});
