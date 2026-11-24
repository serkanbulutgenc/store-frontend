import type { AnyFieldApi } from "@tanstack/react-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorText } from "../forms/field";
import { addAccount, editAccount, moveAccount, removeAccount } from "./bank-accounts";
import { type BankAccountValue, MAX_BANK_ACCOUNTS } from "./schemas";

/** The Owner's bank accounts: any number, in the order a Shopper sees them on the order's
 * confirmation and in the payment emails. Saved with the rest of the Settings form. */
export function BankAccountsField({ field, label }: { field: AnyFieldApi; label: string }) {
  const accounts = (field.state.value ?? []) as BankAccountValue[];
  const errors = field.state.meta.errors;
  const set = (next: BankAccountValue[]) => field.handleChange(next);
  return (
    <fieldset className="space-y-3">
      <legend className="font-medium">{label}</legend>
      <p className="text-muted-foreground">
        Havale ile ödeme seçen müşteri hepsini görür ve birine ödeme yapar. Sıra, müşterinin gördüğü
        sıradır.
      </p>
      {accounts.length === 0 && (
        <p className="text-muted-foreground">
          Henüz banka hesabı yok. Hesap eklemezseniz müşteri havale bilgisi göremez.
        </p>
      )}
      <ol className="space-y-3">
        {accounts.map((account, i) => {
          const n = i + 1;
          const id = `${field.name}-${i}`;
          return (
            // Position is the identity: accounts have no id until saved, and the list is replaced whole.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            <li key={i} className="space-y-2 rounded-md border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{n}. hesap</span>
                <span className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${n}. hesabı yukarı taşı`}
                    disabled={i === 0}
                    onClick={() => set(moveAccount(accounts, i, -1))}
                  >
                    <ArrowUp aria-hidden className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${n}. hesabı aşağı taşı`}
                    disabled={i === accounts.length - 1}
                    onClick={() => set(moveAccount(accounts, i, 1))}
                  >
                    <ArrowDown aria-hidden className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${n}. hesabı sil`}
                    onClick={() => set(removeAccount(accounts, i))}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </span>
              </div>
              <div className="space-y-1">
                <label htmlFor={`${id}-name`} className="block">
                  Banka
                </label>
                <Input
                  id={`${id}-name`}
                  value={account.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => set(editAccount(accounts, i, "name", e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${id}-holder`} className="block">
                  Hesap sahibi
                </label>
                <Input
                  id={`${id}-holder`}
                  value={account.account_holder}
                  onBlur={field.handleBlur}
                  onChange={(e) => set(editAccount(accounts, i, "account_holder", e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${id}-iban`} className="block">
                  IBAN
                </label>
                <Input
                  id={`${id}-iban`}
                  value={account.iban}
                  className="font-mono"
                  onBlur={field.handleBlur}
                  onChange={(e) => set(editAccount(accounts, i, "iban", e.target.value))}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {errors.length > 0 && (
        <p role="alert" className="text-red-700">
          {errorText(errors[0])}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={accounts.length >= MAX_BANK_ACCOUNTS}
        onClick={() => set(addAccount(accounts))}
      >
        <Plus aria-hidden className="size-4" />
        Hesap ekle
      </Button>
    </fieldset>
  );
}
