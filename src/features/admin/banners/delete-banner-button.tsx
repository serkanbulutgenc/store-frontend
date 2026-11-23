import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/errors";
import { useDeleteBanner } from "./queries";

/** Delete a Banner after a confirmation. The caller decides whether to offer it (`canDelete`);
 * the API enforces the rule. */
export function DeleteBannerButton({
  id,
  name,
  onDeleted,
}: {
  id: number;
  name: string;
  onDeleted?: () => void;
}) {
  const remove = useDeleteBanner();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await remove(id);
      toast.success("Banner silindi.");
      setOpen(false);
      onDeleted?.();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Sil<span className="sr-only"> {name}</span>
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Banner'ı sil">
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">{name}</span> kalıcı olarak silinsin mi? Görselleri de
            silinir ve bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button size="sm" disabled={busy} onClick={() => void confirm()}>
              Sil
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
