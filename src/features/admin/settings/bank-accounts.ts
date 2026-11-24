import { arrayMove } from "@dnd-kit/sortable";
import { type BankAccountValue, MAX_BANK_ACCOUNTS } from "./schemas";

/** Pure edits of the Owner's list of bank accounts, in the order a Shopper will see them. */

export const emptyAccount = (): BankAccountValue => ({ name: "", account_holder: "", iban: "" });

/** A blank account at the end, unless the list is already as long as the API allows. */
export function addAccount(accounts: BankAccountValue[]): BankAccountValue[] {
  return accounts.length >= MAX_BANK_ACCOUNTS ? accounts : [...accounts, emptyAccount()];
}

export function removeAccount(accounts: BankAccountValue[], index: number): BankAccountValue[] {
  return accounts.filter((_, i) => i !== index);
}

/** Change one field of one account. */
export function editAccount(
  accounts: BankAccountValue[],
  index: number,
  field: keyof BankAccountValue,
  value: string,
): BankAccountValue[] {
  return accounts.map((a, i) => (i === index ? { ...a, [field]: value } : a));
}

/** Move an account one place up (-1) or down (1); at either end it stays put. */
export function moveAccount(
  accounts: BankAccountValue[],
  index: number,
  by: -1 | 1,
): BankAccountValue[] {
  const to = index + by;
  if (index < 0 || to < 0 || to >= accounts.length) return accounts;
  return arrayMove(accounts, index, to);
}
