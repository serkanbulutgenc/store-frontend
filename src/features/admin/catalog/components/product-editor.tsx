import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { statusLabel } from "../labels";
import { type ProductStatus, productQuery, useSetStatus } from "../queries";
import { ProductForm } from "./product-form";
import { VariantsSection } from "./variants-section";

const TONE = { draft: "neutral", published: "good", archived: "warn" } as const;

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
        <Link to={"/admin/products" as "/admin"} className="text-muted-foreground underline">
          Ürünler
        </Link>
        <h1 className="text-lg font-semibold">{product.title}</h1>
        <Badge tone={TONE[product.status]}>{statusLabel(product.status)}</Badge>
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
      <ProductForm key={product.id} product={product} me={me} onSaved={() => undefined} />
      <VariantsSection product={product} me={me} />
      <section className="space-y-1">
        <h2 className="text-base font-semibold">Fotoğraflar</h2>
        <p className="text-muted-foreground">
          Fotoğraf yükleme ayrı bir ekranda eklenecek. Fotoğrafsız ürün yayınlanamaz.
        </p>
      </section>
    </div>
  );
}

export function useGoToProduct() {
  const navigate = useNavigate();
  return (id: number) => navigate({ href: `/admin/products/${id}` });
}
