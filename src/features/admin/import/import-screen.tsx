import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { useConfirmImport, usePreviewImport } from "./queries";
import {
  ACTION_LABEL,
  confirmBlocker,
  createdLists,
  describeCounts,
  type ImportPlan,
  validateCsvFile,
} from "./rules";
import { TEMPLATE_CSV, TEMPLATE_FILENAME } from "./template";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = TEMPLATE_FILENAME;
  a.click();
  URL.revokeObjectURL(url);
}

type Done = { plan: ImportPlan; fileName: string };

export function ImportScreen() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const preview = usePreviewImport();
  const confirm = useConfirmImport();

  function reset() {
    setFile(null);
    setPlan(null);
    setDone(null);
    setProblem(null);
    if (input.current) input.current.value = "";
  }

  async function pick(next: File | undefined) {
    setPlan(null);
    setDone(null);
    setProblem(null);
    if (!next) return setFile(null);
    const invalid = validateCsvFile(next);
    if (invalid) {
      setFile(null);
      return setProblem(invalid);
    }
    setFile(next);
    try {
      setPlan(await preview.mutateAsync(next));
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Dosya okunamadı.");
    }
  }

  async function apply() {
    if (!file || confirm.isPending) return;
    try {
      const result = await confirm.mutateAsync(file);
      setDone({ plan: result, fileName: file.name });
      setPlan(null);
      toast.success("İçe aktarma tamamlandı.");
    } catch (err) {
      // The file may have changed since the preview; show the API's row errors again.
      setProblem(
        err instanceof ApiError && err.fields.file?.length
          ? err.fields.file.join("\n")
          : err instanceof Error
            ? err.message
            : "İçe aktarma başarısız. Hiçbir şey kaydedilmedi.",
      );
      try {
        setPlan(await preview.mutateAsync(file));
      } catch {
        setPlan(null);
      }
    }
  }

  const blocker = plan ? confirmBlocker(plan) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Ürünleri içe aktar</h1>
        <p className="text-sm text-muted-foreground">
          Bir CSV dosyasından ürün, varyant, fiyat ve stok yükleyin ya da düzeltin. Önce önizleme
          gösterilir; onaylamadan hiçbir şey kaydedilmez. Fotoğraflar dosyayla yüklenmez, ürün
          ekranından eklenir. Aynı dosyayı düzeltip yeniden yüklerseniz kayıtlar çoğalmaz,
          güncellenir.
        </p>
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          Şablon CSV indir
        </Button>
      </div>

      <div className="space-y-1 text-sm">
        <label htmlFor="import-file" className="font-medium">
          CSV dosyası
        </label>
        <input
          ref={input}
          id="import-file"
          type="file"
          accept=".csv,.txt,text/csv"
          className="block text-sm"
          disabled={preview.isPending || confirm.isPending}
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            // Clear the input so choosing the same path again (after fixing the file on
            // disk) fires another change event and a fresh preview.
            e.target.value = "";
            void pick(chosen);
          }}
        />
        {preview.isPending && <p className="text-muted-foreground">Önizleme hazırlanıyor…</p>}
      </div>

      {problem && (
        <p role="alert" className="whitespace-pre-line text-sm text-destructive">
          {problem}
        </p>
      )}

      {plan && file && (
        <section className="space-y-4" aria-label="Önizleme">
          <h2 className="text-lg font-medium">Önizleme: {file.name}</h2>
          <p className="text-sm">{describeCounts(plan.counts)}.</p>

          {createdLists(plan).map((l) => (
            <div key={l.label} className="text-sm">
              <span className="font-medium">{l.label}: </span>
              {l.items.join(", ")}
            </div>
          ))}

          {plan.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-destructive">{plan.errors.length} hatalı satır</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Satır</TableHead>
                    <TableHead>Sütun</TableHead>
                    <TableHead>Hata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.errors.map((e, i) => (
                    // Several errors may share a row and column, so the index disambiguates.
                    // biome-ignore lint/suspicious/noArrayIndexKey: rows are static
                    <TableRow key={`${e.row}-${e.column}-${i}`}>
                      <TableCell>{e.row}</TableCell>
                      <TableCell>
                        <code>{e.column || "-"}</code>
                      </TableCell>
                      <TableCell>{e.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {plan.rows.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                Satırlar ({plan.rows.length})
              </summary>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Satır</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Renk</TableHead>
                    <TableHead>Beden</TableHead>
                    <TableHead>SKU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.rows.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            r.action === "create"
                              ? "good"
                              : r.action === "update"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {ACTION_LABEL[r.action] ?? r.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.product}</TableCell>
                      <TableCell>{r.colour}</TableCell>
                      <TableCell>{r.size}</TableCell>
                      <TableCell>{r.sku || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </details>
          )}

          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => void apply()}
              disabled={!!blocker || confirm.isPending}
            >
              {confirm.isPending ? "Kaydediliyor…" : "Onayla ve içe aktar"}
            </Button>
            {blocker && <p className="text-sm text-muted-foreground">{blocker}</p>}
          </div>
        </section>
      )}

      {done && (
        <section className="space-y-3" aria-label="Sonuç">
          <h2 className="text-lg font-medium">İçe aktarma tamamlandı</h2>
          <p className="text-sm" role="status">
            {done.fileName}: {describeCounts(done.plan.counts)}.
          </p>
          <p className="text-sm text-muted-foreground">
            Yeni ürünler taslak olarak eklendi; fotoğraf ekleyip yayınlayın.
          </p>
          <Button type="button" variant="outline" onClick={reset}>
            Başka dosya yükle
          </Button>
        </section>
      )}
    </div>
  );
}
