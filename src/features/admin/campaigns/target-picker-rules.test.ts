import { describe, expect, it } from "vitest";
import { offeredTargets, pickerKey } from "./target-picker-rules";

const all = [
  { id: 1, name: "Elbise" },
  { id: 2, name: "Gömlek" },
  { id: 3, name: "Pantolon" },
];

describe("offeredTargets", () => {
  it("offers the matches that are not chosen yet", () => {
    expect(offeredTargets(all, [{ id: 2, name: "Gömlek" }], "", 0)).toEqual([
      { id: 1, name: "Elbise" },
      { id: 3, name: "Pantolon" },
    ]);
  });

  it("offers nothing until enough letters are typed", () => {
    expect(offeredTargets(all, [], "e", 2)).toEqual([]);
    expect(offeredTargets(all, [], " e ", 2)).toEqual([]);
    expect(offeredTargets(all, [], "el", 2)).toHaveLength(3);
  });

  it("offers at most eight", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `K${i}` }));
    expect(offeredTargets(many, [], "", 0)).toHaveLength(8);
  });
});

describe("pickerKey", () => {
  const closed = { open: false, active: 0 };
  const open = (active: number) => ({ open: true, active });

  it("opens the dropdown on ArrowDown and moves down, wrapping at the end", () => {
    expect(pickerKey(closed, "ArrowDown", 3)).toEqual({ open: true, active: 0, pick: null });
    expect(pickerKey(open(0), "ArrowDown", 3)).toEqual({ open: true, active: 1, pick: null });
    expect(pickerKey(open(2), "ArrowDown", 3)).toEqual({ open: true, active: 0, pick: null });
  });

  it("moves up on ArrowUp, wrapping to the last; opening on the last", () => {
    expect(pickerKey(open(1), "ArrowUp", 3)).toEqual({ open: true, active: 0, pick: null });
    expect(pickerKey(open(0), "ArrowUp", 3)).toEqual({ open: true, active: 2, pick: null });
    expect(pickerKey(closed, "ArrowUp", 3)).toEqual({ open: true, active: 2, pick: null });
  });

  it("picks the active suggestion on Enter and closes", () => {
    expect(pickerKey(open(1), "Enter", 3)).toEqual({ open: false, active: 0, pick: 1 });
  });

  it("does not pick on Enter when closed or when nothing is offered", () => {
    expect(pickerKey(closed, "Enter", 3).pick).toBeNull();
    expect(pickerKey(open(0), "Enter", 0).pick).toBeNull();
  });

  it("closes on Escape", () => {
    expect(pickerKey(open(2), "Escape", 3)).toEqual({ open: false, active: 0, pick: null });
  });

  it("stays closed with nothing to offer", () => {
    expect(pickerKey(closed, "ArrowDown", 0)).toEqual({ open: false, active: 0, pick: null });
  });
});
