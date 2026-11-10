import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "@/features/admin/forms/api-errors";
import { bind, Field, FormMessage } from "@/features/admin/forms/field";
import { addressesQuery, useDeleteAddress, useSaveAddress } from "../queries";
import {
  type AddressValues,
  addressSchema,
  emptyAddress,
  MAX_ADDRESSES,
  type SavedAddress,
} from "../schemas";

function AddressForm({ address, onDone }: { address: SavedAddress | null; onDone: () => void }) {
  const save = useSaveAddress();
  const initial: AddressValues = address
    ? {
        full_name: address.full_name,
        phone: address.phone,
        il: address.il,
        ilce: address.ilce,
        mahalle: address.mahalle,
        street: address.street,
        postal_code: address.postal_code,
        is_default: address.is_default,
      }
    : emptyAddress;
  const form = useForm({
    defaultValues: initial,
    validators: {
      onSubmit: addressSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await save.mutateAsync({ id: address?.id, values: value });
          toast.success("Adres kaydedildi.");
          onDone();
          return undefined;
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
      },
    },
  });
  const parts = [
    ["full_name", "Ad soyad", "name"],
    ["phone", "Telefon", "tel"],
    ["il", "İl", "address-level1"],
    ["ilce", "İlçe", "address-level2"],
    ["mahalle", "Mahalle", "off"],
    ["street", "Cadde, sokak, bina ve daire no", "street-address"],
    ["postal_code", "Posta kodu (isteğe bağlı)", "postal-code"],
  ] as const;
  return (
    <form
      noValidate
      className="space-y-3 rounded-md border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {parts.map(([name, label, autoComplete]) => (
          <form.Field key={name} name={name}>
            {(f) => (
              <div className={name === "street" ? "sm:col-span-2" : undefined}>
                <Field field={f} label={label}>
                  <Input autoComplete={autoComplete} className="h-11" {...bind(f)} />
                </Field>
              </div>
            )}
          </form.Field>
        ))}
      </div>
      <form.Field name="is_default">
        {(f) => (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={f.state.value}
              disabled={address?.is_default}
              onChange={(e) => f.handleChange(e.target.checked)}
              className="size-4 accent-primary"
            />
            Varsayılan adresim olsun
          </label>
        )}
      </form.Field>
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <div className="flex gap-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <Button type="submit" disabled={submitting}>
              Kaydet
            </Button>
          )}
        </form.Subscribe>
        <Button type="button" variant="outline" onClick={onDone}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}

export function AddressesPage() {
  const { data: addresses = [], isPending } = useQuery(addressesQuery);
  const remove = useDeleteAddress();
  // `null` is a new address; a number is the one being edited; `undefined` is no form.
  const [editing, setEditing] = useState<SavedAddress | null | undefined>(undefined);
  const full = addresses.length >= MAX_ADDRESSES;

  return (
    <section aria-labelledby="addresses" className="max-w-2xl space-y-4">
      <h1 id="addresses" className="text-2xl font-semibold">
        Adreslerim
      </h1>
      {isPending && <div className="h-24 animate-pulse rounded-md bg-muted" aria-busy="true" />}
      {!isPending && addresses.length === 0 && editing === undefined && (
        <p>Kayıtlı adresiniz yok. Eklediğiniz adres ödeme sayfasında hazır gelir.</p>
      )}
      <ul className="space-y-3">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-md border border-border bg-card p-4">
            {editing?.id === a.id ? (
              <AddressForm address={a} onDone={() => setEditing(undefined)} />
            ) : (
              <div className="flex flex-wrap justify-between gap-3">
                <address className="not-italic">
                  <strong>{a.full_name}</strong>
                  {a.is_default && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      Varsayılan
                    </span>
                  )}
                  <br />
                  {a.street}, {a.mahalle}
                  <br />
                  {a.ilce} / {a.il} {a.postal_code}
                  <br />
                  {a.phone}
                </address>
                <div className="flex items-start gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(a)}>
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(a.id, { onSuccess: () => toast.success("Adres silindi.") })
                    }
                  >
                    Sil
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {editing === null && <AddressForm address={null} onDone={() => setEditing(undefined)} />}
      {editing === undefined && (
        <div>
          <Button onClick={() => setEditing(null)} disabled={full}>
            Yeni adres ekle
          </Button>
          {full && (
            <p className="mt-2 text-muted-foreground">
              En fazla {MAX_ADDRESSES} adres kaydedebilirsiniz.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
