import { expect, it } from "vitest";
import type { VariantOut } from "./queries";
import {
  gridChanges,
  gridColours,
  gridSizes,
  invalidCells,
  missingCount,
  toggle,
} from "./variant-tools";

const v = (id: number, colourId: number, size: string, onHand: number): VariantOut =>
  ({
    id,
    colour: { id: colourId, name: `C${colourId}`, hex_code: "#000000" },
    size,
    stock: { on_hand: onHand, allocated: 0 },
  }) as VariantOut;

const variants = [v(1, 1, "S", 5), v(2, 1, "M", 5), v(3, 2, "M", 0)];

it("lists colours once and sizes in scheme order", () => {
  expect(gridColours(variants).map((c) => c.id)).toEqual([1, 2]);
  expect(gridSizes(variants, ["XS", "S", "M", "L"])).toEqual(["S", "M"]);
  expect(gridSizes(variants, ["XS", "S"])).toEqual(["S", "M"]);
});

it("turns only edited, changed cells into deltas", () => {
  const draft = { 1: "7", 2: "5", 3: "" };
  expect(gridChanges(variants, draft)).toEqual([{ variant_id: 1, delta: 2 }]);
  expect(gridChanges(variants, { 1: "3", 2: "0", 3: "4" })).toEqual([
    { variant_id: 1, delta: -2 },
    { variant_id: 2, delta: -5 },
    { variant_id: 3, delta: 4 },
  ]);
});

it("sends nothing for an untouched grid and skips junk", () => {
  expect(gridChanges(variants, {})).toEqual([]);
  expect(gridChanges(variants, { 1: "-1", 2: "abc" })).toEqual([]);
  expect(invalidCells(variants, { 1: "-1", 2: "abc", 3: "4", 4: " ", 5: "1" })).toEqual([1, 2, 4]);
  expect(invalidCells(variants, { 3: "100001" })).toEqual([3]);
});

it("toggles and counts missing combinations", () => {
  expect(toggle([1, 2], 2)).toEqual([1]);
  expect(toggle([1], 3)).toEqual([1, 3]);
  expect(missingCount(variants, [1, 2], ["S", "M"])).toBe(1);
});
