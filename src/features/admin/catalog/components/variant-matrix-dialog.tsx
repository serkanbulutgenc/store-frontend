import { useSuspenseQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { coloursQuery, type ProductOut, useGenerateVariants } from "../queries";
import { isPrice, isWhole, MAX_DELTA, missingCount, toggle } from "../variant-tools";

/** Pick colours and sizes; every missing combination is created in one go. */
export function VariantMatrixDialog({
  product,
  open,
  onClose,
}: {
  product: ProductOut;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Varyantları toplu oluştur">
      {open && <MatrixForm product={product} onClose={onClose} />}
    </Dialog>
  );
}

function MatrixForm({ product, onClose }: { product: ProductOut; onClose: () => void }) {
  const { data: colours } = useSuspenseQuery(coloursQuery);
  const generate = useGenerateVariants(product.id);
  const [colourIds, setColourIds] = useState<number[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const priceId = useId();
  const stockId = useId();

  const stockNumber = isWhole(stock) && Number(stock) <= MAX_DELTA ? Number(stock) : null;
  const priceOk = price.trim() === "" || isPrice(price);
  const fresh = missingCount(product.variants, colourIds, sizes);
  const canSubmit = fresh > 0 && stockNumber !== null && priceOk && !generate.isPending;

  const submit = async () => {
    setError(null);
    try {
      const r = await generate.mutateAsync({
        colour_ids: colourIds,
        sizes,
        stock: stockNumber ?? 0,
        price_override: price.trim() || null,
      });
      toast.success(
        r.created.length === 0
          ? "Hepsi zaten vardı, yeni varyant eklenmedi."
          : r.skipped.length === 0
            ? `${r.created.length} varyant eklendi.`
            : `${r.created.length} varyant eklendi, ${r.skipped.length} atlandı.`,
      );
      onClose();
    } catch (e) {
      setError(apiErrorToFormErrors(e).form);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Renkler</legend>
        <div className="flex flex-wrap gap-2">
          {colours
            .filter((c) => c.is_active)
            .map((c) => (
              <label key={c.id} className="inline-flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={colourIds.includes(c.id)}
                  onChange={() => setColourIds(toggle(colourIds, c.id))}
                />
                <span
                  aria-hidden
                  className="size-3 rounded-sm border border-border"
                  style={{ background: c.hex_code }}
                />
                {c.name}
              </label>
            ))}
        </div>
      </fieldset>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">
          Bedenler <span className="text-muted-foreground">({product.product_class.name})</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.product_class.sizes.map((s) => (
            <label key={s} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={sizes.includes(s)}
                onChange={() => setSizes(toggle(sizes, s))}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 text-sm">
          <label htmlFor={priceId} className="font-medium">
            Varyant fiyatı
          </label>
          <Input
            id={priceId}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <span className="block text-xs text-muted-foreground">
            {priceOk ? "Boşsa ürün fiyatı geçerli olur." : "Fiyatı 349.90 biçiminde yazın."}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor={stockId} className="font-medium">
            Açılış stoğu
          </label>
          <Input
            id={stockId}
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <span className="block text-xs text-muted-foreground">
            {stockNumber === null ? "0 ile 100000 arasında tam sayı." : "Her yeni varyant için."}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {colourIds.length * sizes.length === 0
          ? "Renk ve beden seçin."
          : fresh === 0
            ? "Seçilen tüm kombinasyonlar zaten var."
            : `${fresh} yeni varyant oluşturulacak, ${colourIds.length * sizes.length - fresh} mevcut atlanacak.`}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          Oluştur
        </Button>
      </div>
    </form>
  );
}
