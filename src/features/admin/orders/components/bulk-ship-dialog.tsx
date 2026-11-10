import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * Ship several preparing orders at once: one carrier, one tracking number per order. Orders
 * are sent one by one so a failure on one does not hide the rest; failures stay selected.
 */
export function BulkShipDialog({
  open,
  numbers,
  ship,
  onDone,
}: {
  open: boolean;
  numbers: string[];
  ship: (number: string, body: { carrier: string; tracking_number: string }) => Promise<unknown>;
  /** `null` when the dialog was dismissed without shipping. */
  onDone: (failed: string[] | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const dismiss = () => {
    if (!busy) onDone(null);
  };
  return (
    <Dialog open={open} onClose={dismiss} title="Toplu kargola">
      {open && (
        <Form
          numbers={numbers}
          ship={ship}
          busy={busy}
          setBusy={setBusy}
          onDone={onDone}
          onCancel={dismiss}
        />
      )}
    </Dialog>
  );
}

function Form({
  numbers,
  ship,
  busy,
  setBusy,
  onDone,
  onCancel,
}: {
  busy: boolean;
  setBusy: (b: boolean) => void;
  onCancel: () => void;
  numbers: string[];
  ship: (number: string, body: { carrier: string; tracking_number: string }) => Promise<unknown>;
  onDone: (failed: string[]) => void;
}) {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!carrier.trim() || numbers.some((n) => !tracking[n]?.trim())) {
      setError("Kargo firmasını ve her siparişin takip numarasını girin.");
      return;
    }
    setBusy(true);
    const failed: string[] = [];
    for (const n of numbers) {
      try {
        await ship(n, { carrier: carrier.trim(), tracking_number: (tracking[n] ?? "").trim() });
      } catch {
        failed.push(n);
      }
    }
    setBusy(false);
    if (failed.length) toast.error(`Kargolanamadı: ${failed.join(", ")}`);
    else toast.success(`${numbers.length} sipariş kargolandı.`);
    onDone(failed);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <label htmlFor="bulk-carrier" className="block font-medium">
          Kargo firması
        </label>
        <Input
          id="bulk-carrier"
          autoFocus
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
        />
      </div>
      {numbers.map((n) => (
        <div key={n} className="space-y-1">
          <label htmlFor={`track-${n}`} className="block font-mono text-xs">
            {n} · takip numarası
          </label>
          <Input
            id={`track-${n}`}
            value={tracking[n] ?? ""}
            onChange={(e) => setTracking((t) => ({ ...t, [n]: e.target.value }))}
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit" size="sm" disabled={busy}>
          Kargola
        </Button>
      </div>
    </form>
  );
}
