import { useSuspenseQuery } from "@tanstack/react-query";
import { Camera, CircleAlert, CircleDollarSign, FileText, Layers } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { can, type Me } from "@/lib/api/me";
import { useCrumbLabel } from "../../components/crumb-labels";
import { PhotosScreen } from "../../photos/photos-screen";
import { statusLabel, statusTone } from "../labels";
import { type ProductStatus, productQuery, useSetStatus } from "../queries";
import {
  GENERAL_FIELDS,
  GeneralFields,
  PRICE_FIELDS,
  PriceFields,
  ProductFormFooter,
  useProductForm,
} from "./product-form";
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

export type EditorTab = "general" | "price" | "variants" | "photos";
export const EDITOR_TABS: EditorTab[] = ["general", "price", "variants", "photos"];

const panelClass = "data-[state=inactive]:hidden";

export function ProductEditor({
  productId,
  me,
  initialTab = "general",
}: {
  productId: number;
  me: Me;
  initialTab?: EditorTab;
}) {
  const { data: product } = useSuspenseQuery(productQuery(productId));
  useCrumbLabel(String(productId), product.title);
  const setStatus = useSetStatus(productId);
  const canManage = can(me, "manage_products");
  const actions = statusActions(product.status, {
    manage: canManage,
    archive: can(me, "archive_products"),
  });
  // The tab lives in local state, not the URL: a search-param change would trip the
  // unsaved-changes guard on a plain tab switch.
  const [tab, setTab] = useState<EditorTab>(
    initialTab === "photos" && !canManage ? "general" : initialTab,
  );
  const form = useProductForm({ product, me });

  async function move(to: ProductStatus) {
    try {
      await setStatus.mutateAsync(to);
      toast.success(`Ürün durumu: ${statusLabel(to)}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Durum değiştirilemedi.");
    }
  }

  return (
    <div className="space-y-4">
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as EditorTab)}>
        <div className="overflow-x-auto">
          <form.Subscribe selector={(s) => s.fieldMeta}>
            {(meta) => {
              const bad = (names: readonly string[]) =>
                names.some((n) => (meta[n as keyof typeof meta]?.errors.length ?? 0) > 0);
              const marker = (on: boolean) =>
                on && (
                  <>
                    <CircleAlert aria-hidden className="size-4 text-red-700" />
                    <span className="sr-only">Geçersiz alan var</span>
                  </>
                );
              return (
                <TabsList variant="line">
                  <TabsTrigger value="general" className="gap-1.5">
                    <FileText aria-hidden className="size-4" />
                    Genel
                    {marker(bad(GENERAL_FIELDS))}
                  </TabsTrigger>
                  <TabsTrigger value="price" className="gap-1.5">
                    <CircleDollarSign aria-hidden className="size-4" />
                    Fiyat
                    {marker(bad(PRICE_FIELDS))}
                  </TabsTrigger>
                  <TabsTrigger value="variants" className="gap-1.5">
                    <Layers aria-hidden className="size-4" />
                    Varyantlar
                  </TabsTrigger>
                  {canManage && (
                    <TabsTrigger value="photos" className="gap-1.5">
                      <Camera aria-hidden className="size-4" />
                      Fotoğraflar
                    </TabsTrigger>
                  )}
                </TabsList>
              );
            }}
          </form.Subscribe>
        </div>

        {/* Genel and Fiyat are one form: both stay mounted, so edits survive a tab switch. */}
        <form
          className="max-w-3xl space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <TabsContent value="general" forceMount className={panelClass}>
            <GeneralFields form={form} me={me} product={product} />
          </TabsContent>
          <TabsContent value="price" forceMount className={panelClass}>
            <PriceFields form={form} me={me} product={product} />
          </TabsContent>
          {(tab === "general" || tab === "price") && (
            <ProductFormFooter form={form} me={me} label="Kaydet" />
          )}
        </form>

        <TabsContent value="variants" forceMount className={panelClass}>
          <VariantsSection product={product} me={me} />
        </TabsContent>
        {canManage && (
          <TabsContent value="photos" forceMount className={panelClass}>
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <PhotosScreen productId={productId} />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
