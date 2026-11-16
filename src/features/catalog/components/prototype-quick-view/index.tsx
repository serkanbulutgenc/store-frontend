// PROTOTYPE: quick view + quick add on product cards. Throwaway; see the PR/issue for the verdict.
import type { ProductCard } from "../../queries";
import { CardActionsA } from "./variant-a";
import { CardActionsB } from "./variant-b";
import { CardActionsC } from "./variant-c";
import { useVariant } from "./variant-store";

export { PrototypeSwitcher } from "./switcher";

export function QuickActions({ product }: { product: ProductCard }) {
  const v = useVariant();
  if (v === "B") return <CardActionsB product={product} />;
  if (v === "C") return <CardActionsC product={product} />;
  return <CardActionsA product={product} />;
}
