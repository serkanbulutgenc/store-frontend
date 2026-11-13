import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { type ProductOut, useSaveStockGrid } from "../queries";
import {
  cellKey,
  type GridDraft,
  gridChanges,
  gridColours,
  gridSizes,
  invalidCells,
} from "../variant-tools";

/** Colour rows by size columns; only existing Variants are editable. Saves the changed cells. */
export function StockGridDialog({
  product,
  open,
  onClose,
}: {
  product: ProductOut;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Stok tablosu">
      {open && <Grid product={product} onClose={onClose} />}
    </Dialog>
  );
}

function Grid({ product, onClose }: { product: ProductOut; onClose: () => void }) {
  const save = useSaveStockGrid(product.id);
  const [draft, setDraft] = useState<GridDraft>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reasonId = useId();

  const colours = gridColours(product.variants);
  const sizes = gridSizes(product.variants, product.product_class.sizes);
  const byCell = new Map(product.variants.map((v) => [cellKey(v.colour.id, v.size), v]));
  const changes = gridChanges(product.variants, draft);
  const bad = new Set(invalidCells(product.variants, draft));
  const canSave =
    changes.length > 0 && bad.size === 0 && reason.trim().length >= 3 && !save.isPending;

  const submit = async () => {
    setError(null);
    try {
      await save.mutateAsync({ reason: reason.trim(), cells: changes });
      toast.success(`${changes.length} stok değişikliği kaydedildi.`);
      onClose();
    } catch (e) {
      setError(apiErrorToFormErrors(e).form);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th className="p-1 text-left font-medium">Renk</th>
              {sizes.map((s) => (
                <th key={s} className="p-1 text-center font-medium">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colours.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="whitespace-nowrap p-1 text-left font-normal">
                  <span
                    aria-hidden
                    className="mr-1.5 inline-block size-3 rounded-sm border border-border align-middle"
                    style={{ background: c.hex_code }}
                  />
                  {c.name}
                </th>
                {sizes.map((s) => {
                  const v = byCell.get(cellKey(c.id, s));
                  return (
                    <td key={s} className="p-1">
                      {v ? (
                        <Input
                          className="w-16 text-center"
                          inputMode="numeric"
                          aria-label={`${c.name} ${s} stok`}
                          aria-invalid={bad.has(v.id) || undefined}
                          value={draft[v.id] ?? String(v.stock.on_hand)}
                          onChange={(e) => setDraft((d) => ({ ...d, [v.id]: e.target.value }))}
                        />
                      ) : (
                        <span className="block text-center text-muted-foreground">–</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-1 text-sm">
        <label htmlFor={reasonId} className="font-medium">
          Gerekçe
        </label>
        <Input
          id={reasonId}
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <span className="block text-xs text-muted-foreground">
          Değişen her hücre bu gerekçeyle denetim kaydına yazılır.
        </span>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {bad.size > 0
          ? "Kırmızı hücrelere 0 veya daha büyük bir tam sayı yazın (tek seferde en çok 100000 fark)."
          : changes.length === 0
            ? "Değişiklik yok."
            : `${changes.length} hücre değişti.`}
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
        <Button type="submit" disabled={!canSave}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
