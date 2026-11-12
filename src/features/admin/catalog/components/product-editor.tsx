import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { useCrumbLabel } from "../../components/crumb-labels";
import { statusLabel, statusTone } from "../labels";
import { type ProductStatus, productQuery, useSetStatus } from "../queries";
import { ProductForm } from "./product-form";
import { VariantsSection } from "./variants-section";

/** Which status moves the user may make from the current one. Archive is Owner-only. */
export function statusActions(status: ProductStatus, perms: { manage: boolean; archive: boolean }) {
  const actions: { to: ProductStatus; label: string }[] = [];
  if (perms.manage) {
    if (status === "draft") actions.push({ to: "published", label: "Yayınla" });
    if (status === "published") actions.push({ to: "draft", label: "Taslağa al" });
  }
  if (perms.archive) {
    if (status !== "archived") actions.push({ to: "archived", label: "Arşivle" });
    else actions.push({ to: "draft", label: "Arşivden çıkar" });
  }
  return actions;
}

export function ProductEditor({ productId, me }: { productId: number; me: Me }) {
  const { data: product } = useSuspenseQuery(productQuery(productId));
  useCrumbLabel(String(productId), product.title);
  const setStatus = useSetStatus(productId);
  const actions = statusActions(product.status, {
    manage: can(me, "manage_products"),
    archive: can(me, "archive_products"),
  });

  async function move(to: ProductStatus) {
    try {
      await setStatus.mutateAsync(to);
      toast.success(`Ürün durumu: ${statusLabel(to)}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum değiştirilemedi.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">{product.title}</h1>
        <Badge tone={statusTone[product.status]}>{statusLabel(product.status)}</Badge>
        <div className="ml-auto flex gap-2">
          {actions.map((a) => (
            <Button
              key={a.to}
              size="sm"
              variant={a.to === "published" ? "default" : "outline"}
              disabled={setStatus.isPending}
              onClick={() => move(a.to)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
      <ProductForm product={product} me={me} />
      <VariantsSection product={product} me={me} />
      <section className="space-y-1">
        <h2 className="text-base font-semibold">Fotoğraflar</h2>
        <p className="text-muted-foreground">
          Fotoğrafsız ürün yayınlanamaz.{" "}
          {can(me, "manage_products") && (
            <Link
              to="/admin/products/$productId/photos"
              params={{ productId: String(productId) }}
              className="underline"
            >
              Fotoğrafları yönet
            </Link>
          )}
        </p>
      </section>
    </div>
  );
}
