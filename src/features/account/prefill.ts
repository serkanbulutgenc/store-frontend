import type { CheckoutValues } from "@/features/checkout/schemas";
import type { SavedAddress } from "./schemas";

type Profile = { email: string; name: string; phone: string };

/** The default address of an address book, or the first one; none for an empty book. */
export function pickDefault(addresses: SavedAddress[]): SavedAddress | undefined {
  return addresses.find((a) => a.is_default) ?? addresses[0];
}

/**
 * Contact and shipping fields for the checkout form from a Customer's account. Fields the
 * account cannot fill stay as they are, so nothing the Shopper typed is overwritten with a blank.
 */
export function checkoutPrefill(
  profile: Profile,
  addresses: SavedAddress[],
): Partial<Pick<CheckoutValues, "full_name" | "email" | "phone" | "shipping_address">> {
  const address = pickDefault(addresses);
  return {
    email: profile.email,
    full_name: address?.full_name || profile.name,
    phone: address?.phone || profile.phone,
    ...(address && {
      shipping_address: {
        il: address.il,
        ilce: address.ilce,
        mahalle: address.mahalle,
        street: address.street,
        postal_code: address.postal_code,
      },
    }),
  };
}
