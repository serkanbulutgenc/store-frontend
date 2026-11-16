// PROTOTYPE: throwaway. Variant lives in ?variant= but is read straight from the URL, because the
// listing routes' zod search schemas would strip an unknown param.
import { useSyncExternalStore } from "react";

export const VARIANTS = [
  { key: "A", name: "Modal + hover bar" },
  { key: "B", name: "Side sheet + plus button" },
  { key: "C", name: "Inline sizes + bottom sheet" },
] as const;
export type VariantKey = (typeof VARIANTS)[number]["key"];

const listeners = new Set<() => void>();
const read = (): VariantKey => {
  const v = new URLSearchParams(window.location.search).get("variant")?.toUpperCase();
  return VARIANTS.some((x) => x.key === v) ? (v as VariantKey) : "A";
};

export function setVariant(key: VariantKey) {
  const url = new URL(window.location.href);
  url.searchParams.set("variant", key);
  window.history.replaceState(window.history.state, "", url);
  for (const l of listeners) l();
}

export function useVariant(): VariantKey {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener("popstate", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("popstate", cb);
      };
    },
    read,
    () => "A",
  );
}
