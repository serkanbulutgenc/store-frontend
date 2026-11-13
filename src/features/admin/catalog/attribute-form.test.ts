import { expect, it } from "vitest";
import { createSchema, editSchema, optionSchema, parseOptions } from "./attribute-form";

const base = {
  name: "Kumaş",
  kind: "option",
  is_multiple: "false",
  is_filterable: "true",
  options: "Pamuk, Viskon",
};

it("splits a comma list and drops blanks", () => {
  expect(parseOptions(" Pamuk, ,Viskon ,")).toEqual(["Pamuk", "Viskon"]);
  expect(parseOptions("")).toEqual([]);
});

it("accepts an option list with or without options", () => {
  expect(createSchema.safeParse(base).success).toBe(true);
  expect(createSchema.safeParse({ ...base, options: "" }).success).toBe(true);
});

it("rejects duplicate options, ignoring case the Turkish way", () => {
  expect(createSchema.safeParse({ ...base, options: "Işık, ışık" }).success).toBe(false);
});

it("keeps a text attribute plain", () => {
  const text = { ...base, kind: "text", is_filterable: "false", options: "" };
  expect(createSchema.safeParse(text).success).toBe(true);
  for (const extra of [{ is_multiple: "true" }, { is_filterable: "true" }, { options: "A" }]) {
    expect(createSchema.safeParse({ ...text, ...extra }).success).toBe(false);
  }
});

it("needs names", () => {
  expect(createSchema.safeParse({ ...base, name: " " }).success).toBe(false);
  expect(editSchema.safeParse({ name: "", is_filterable: "false" }).success).toBe(false);
  expect(optionSchema.safeParse({ label: " " }).success).toBe(false);
});
