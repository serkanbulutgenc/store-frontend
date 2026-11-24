import { expect, it } from "vitest";
import { editOrder, moveWidget, setWidget } from "./layout";

it("turns a Widget on at the end and off again", () => {
  expect(setWidget(["a"], "b", true)).toEqual(["a", "b"]);
  expect(setWidget(["a", "b"], "a", false)).toEqual(["b"]);
});

it("leaves the layout alone when the Widget is already in that state", () => {
  const layout = ["a", "b"];
  expect(setWidget(layout, "a", true)).toBe(layout);
  expect(setWidget(layout, "z", false)).toBe(layout);
});

it("moves a Widget up or down by one place", () => {
  expect(moveWidget(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
  expect(moveWidget(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
});

it("does not move a Widget past either end or when it is off", () => {
  const layout = ["a", "b"];
  expect(moveWidget(layout, "a", -1)).toBe(layout);
  expect(moveWidget(layout, "b", 1)).toBe(layout);
  expect(moveWidget(layout, "z", 1)).toBe(layout);
});

it("lists Widgets that are on first, in order, then the rest", () => {
  expect(editOrder(["c", "a"], ["a", "b", "c"])).toEqual(["c", "a", "b"]);
});

import { dropWidget, setFolded } from "./layout";

it("drops a Widget onto another's place, either way", () => {
  expect(dropWidget(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
  expect(dropWidget(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
});

it("leaves the layout alone when a drop names itself or an unknown Widget", () => {
  const layout = ["a", "b"];
  expect(dropWidget(layout, "a", "a")).toBe(layout);
  expect(dropWidget(layout, "a", "z")).toBe(layout);
  expect(dropWidget(layout, "z", "a")).toBe(layout);
});

it("folds and opens a Widget without duplicating", () => {
  expect(setFolded([], "a", true)).toEqual(["a"]);
  expect(setFolded(["a", "b"], "a", false)).toEqual(["b"]);
  const folded = ["a"];
  expect(setFolded(folded, "a", true)).toBe(folded);
  expect(setFolded(folded, "z", false)).toBe(folded);
});
