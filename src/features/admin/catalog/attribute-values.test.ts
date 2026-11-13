import { expect, it } from "vitest";
import { chooseOption, draftsFrom, isDirty, toBody } from "./attribute-values";
import type { AttributeOut } from "./attributes-queries";

const attr = (over: Partial<AttributeOut>): AttributeOut => ({
  id: 1,
  product_class_id: 1,
  name: "Kumaş",
  kind: "option",
  is_multiple: false,
  is_filterable: false,
  sort_order: 0,
  options: [
    { id: 10, label: "Pamuk" },
    { id: 11, label: "Viskon" },
  ],
  product_count: 0,
  ...over,
});

const kumas = attr({});
const sezon = attr({ id: 2, name: "Sezon", is_multiple: true });
const bakim = attr({ id: 3, name: "Bakım", kind: "text", options: [] });

it("builds drafts for every attribute, empty when the Product has no value", () => {
  const drafts = draftsFrom([kumas, bakim], [{ attribute_id: 1, text: null, option_ids: [10] }]);
  expect(drafts).toEqual({
    1: { text: "", optionIds: [10] },
    3: { text: "", optionIds: [] },
  });
});

it("sends every attribute so a cleared one is cleared on the server", () => {
  const body = toBody([kumas, bakim], {
    1: { text: "", optionIds: [] },
    3: { text: "  Elde yıkayın ", optionIds: [] },
  });
  expect(body).toEqual([
    { attribute_id: 1, text: null, option_ids: [] },
    { attribute_id: 3, text: "Elde yıkayın", option_ids: [] },
  ]);
});

it("replaces a single choice and toggles a multi choice", () => {
  expect(chooseOption(kumas, [10], 11)).toEqual([11]);
  expect(chooseOption(kumas, [10], null)).toEqual([]);
  expect(chooseOption(sezon, [10], 11)).toEqual([10, 11]);
  expect(chooseOption(sezon, [10, 11], 10)).toEqual([11]);
});

it("notices edits and ignores whitespace and ordering", () => {
  const stored = [{ attribute_id: 2, text: null, option_ids: [10, 11] }];
  const same = draftsFrom([sezon], stored);
  expect(isDirty([sezon], stored, same)).toBe(false);
  expect(isDirty([sezon], stored, { 2: { text: "", optionIds: [11, 10] } })).toBe(false);
  expect(isDirty([sezon], stored, { 2: { text: "", optionIds: [10] } })).toBe(true);
  expect(isDirty([bakim], [], { 3: { text: "  ", optionIds: [] } })).toBe(false);
  expect(isDirty([bakim], [], { 3: { text: "x", optionIds: [] } })).toBe(true);
});
