import { expect, it } from "vitest";
import { addAccount, editAccount, emptyAccount, moveAccount, removeAccount } from "./bank-accounts";
import { MAX_BANK_ACCOUNTS } from "./schemas";

const a = (name: string) => ({ ...emptyAccount(), name });

it("adds a blank account at the end", () => {
  expect(addAccount([a("x")])).toEqual([a("x"), emptyAccount()]);
});

it("stops adding at the most the API allows", () => {
  const full = Array.from({ length: MAX_BANK_ACCOUNTS }, () => emptyAccount());
  expect(addAccount(full)).toBe(full);
});

it("removes the account at an index", () => {
  expect(removeAccount([a("x"), a("y"), a("z")], 1)).toEqual([a("x"), a("z")]);
});

it("edits one field of one account and leaves the rest alone", () => {
  const before = [a("x"), a("y")];
  const after = editAccount(before, 1, "iban", "TR1");
  expect(after[1]).toEqual({ ...a("y"), iban: "TR1" });
  expect(after[0]).toBe(before[0]);
});

it("moves an account up or down by one and keeps it at either end", () => {
  const list = [a("x"), a("y"), a("z")];
  expect(moveAccount(list, 1, -1).map((p) => p.name)).toEqual(["y", "x", "z"]);
  expect(moveAccount(list, 1, 1).map((p) => p.name)).toEqual(["x", "z", "y"]);
  expect(moveAccount(list, 0, -1)).toBe(list);
  expect(moveAccount(list, 2, 1)).toBe(list);
});
