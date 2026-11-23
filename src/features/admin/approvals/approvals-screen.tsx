import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { bannerKeys } from "../banners/queries";
import { pageKeys } from "../campaign-pages/queries";
import { collectionKeys } from "../collections/queries";
import { DiffTable, QueueTable } from "./approval-parts";
import { approvalDetailQuery, approvalKeys, approvalsQuery, decide } from "./queries";
import { type ApprovalItem, REASON_MAX, reasonError } from "./rules";

export function ApprovalsScreen() {
  const { data } = useSuspenseQuery(approvalsQuery());
  const [open, setOpen] = useState<ApprovalItem | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">Onay bekleyenler</h1>
        <p className="text-sm text-muted-foreground">{data.count} bekliyor</p>
      </div>
      <QueueTable items={data.items} onReview={setOpen} />
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} size="lg">
        {open && <ReviewForm item={open} onClose={() => setOpen(null)} />}
      </Dialog>
    </div>
  );
}

/** One waiting item: what differs from the live version, then approve or reject with a reason. */
function ReviewForm({ item, onClose }: { item: ApprovalItem; onClose: () => void }) {
  const qc = useQueryClient();
  const detail = useQuery(approvalDetailQuery(item.type, item.id));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const move = useMutation({
    mutationFn: (decision: "approve" | "reject") => decide(item.type, item.id, decision, reason),
    onSuccess: async (_count, decision) => {
      // A Collection or Campaign page decided here is also shown on its own screen and in the nav badge.
      await Promise.all([
        qc.invalidateQueries({ queryKey: approvalKeys.all }),
        qc.invalidateQueries({ queryKey: collectionKeys.all }),
        qc.invalidateQueries({ queryKey: pageKeys.all }),
        qc.invalidateQueries({ queryKey: bannerKeys.all }),
      ]);
      toast.success(decision === "approve" ? "Onaylandı." : "Reddedildi.");
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu."),
  });
  const tooLong = reasonError(reason);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        {item.label} · {item.is_change ? "Yayındaki sürümde değişiklik" : "İlk yayın"}
        {item.submitted_by ? ` · ${item.submitted_by.name}` : ""}
      </p>
      {detail.data ? (
        <DiffTable fields={detail.data.fields} isChange={item.is_change} />
      ) : (
        <p role="status" className="text-muted-foreground">
          {detail.isError ? "Ayrıntılar yüklenemedi." : "Yükleniyor…"}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="approval-reason" className="block font-medium">
          Gerekçe{" "}
          <span className="font-normal text-muted-foreground">(reddederken gönderen görür)</span>
        </label>
        <Textarea
          id="approval-reason"
          value={reason}
          maxLength={REASON_MAX + 50}
          aria-invalid={!!tooLong}
          onChange={(e) => setReason(e.target.value)}
        />
        {tooLong && <p className="text-red-700">{tooLong}</p>}
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Kapat
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={move.isPending || !!tooLong}
          onClick={() => {
            setError(null);
            move.mutate("reject");
          }}
        >
          Reddet
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={move.isPending}
          onClick={() => {
            setError(null);
            move.mutate("approve");
          }}
        >
          Onayla
        </Button>
      </div>
    </div>
  );
}
