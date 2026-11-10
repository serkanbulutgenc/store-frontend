import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDownloadAccountantCsv } from "./queries";
import { validateRange } from "./range";

export function ExportScreen() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const download = useDownloadAccountantCsv();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateRange(from, to);
    setError(problem);
    if (problem) return;
    try {
      await download.mutateAsync({ from, to });
      toast.success("Dosya indirildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dosya indirilemedi.");
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Muhasebe dışa aktarımı</h1>
      <p className="text-sm text-muted-foreground">
        Seçilen tarihler arasında verilen siparişlerin fatura satırları (CSV). E-posta, telefon ve
        notlar dahil değildir. Her indirme denetim günlüğüne yazılır.
      </p>
      <div className="space-y-1 text-sm">
        <label htmlFor="export-from">Başlangıç</label>
        <Input
          id="export-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>
      <div className="space-y-1 text-sm">
        <label htmlFor="export-to">Bitiş</label>
        <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={download.isPending}>
        CSV indir
      </Button>
    </form>
  );
}
