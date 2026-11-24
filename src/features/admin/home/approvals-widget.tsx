import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { DiffTable } from "../approvals/approval-parts";
import { invalidateDecided } from "../approvals/decided";
import { approvalDetailQuery, decide } from "../approvals/queries";
import { type ApprovalItem, itemKey, kindBadge } from "../approvals/rules";
import type { HomeData } from "../returns/queries";
import { PREVIEW_ROWS, WidgetCard } from "./widget-card";

/** What Staff submitted and the Owner has not decided. Approve is a Quick action behind a
 * confirmation that shows what will change; Reject needs a reason, so it lives on the queue. */
export function ApprovalsWidget({ data }: { data: NonNullable<HomeData["approvals"]> }) {
  const [target, setTarget] = useState<ApprovalItem | null>(null);
  return (
    <WidgetCard
      id="widget-approvals"
      title="Onay bekleyenler"
      count={data.count}
      empty="Onay bekleyen bir şey yok."
      seeAll={
        <Link to="/admin/approvals" className="text-primary underline">
          Tümünü gör ({data.count})
        </Link>
      }
    >
      <ul className="divide-y divide-border">
        {data.rows.slice(0, PREVIEW_ROWS).map((item) => {
          const badge = kindBadge(item);
          return (
            <li
              key={itemKey(item)}
              className="flex flex-wrap items-center justify-between gap-2 py-1"
            >
              <span className="flex flex-wrap items-center gap-1">
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground">{item.label}</span>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </span>
              <span className="text-muted-foreground">
                {item.submitted_by?.name ?? "—"}
                {item.submitted_at ? ` · ${formatDate(item.submitted_at)}` : ""}
              </span>
              <Button
                size="sm"
                variant="outline"
                aria-label={`${item.title} onayla`}
                onClick={() => setTarget(item)}
              >
                Onayla
              </Button>
            </li>
          );
        })}
      </ul>
      <Dialog
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target?.title ?? ""}
        size="lg"
      >
        {target && <ConfirmApprove item={target} onClose={() => setTarget(null)} />}
      </Dialog>
    </WidgetCard>
  );
}

function ConfirmApprove({ item, onClose }: { item: ApprovalItem; onClose: () => void }) {
  const qc = useQueryClient();
  const detail = useQuery(approvalDetailQuery(item.type, item.id));
  const approve = useMutation({
    mutationFn: () => decide(item.type, item.id, "approve"),
    onSuccess: async () => {
      await invalidateDecided(qc);
      toast.success("Onaylandı.");
      onClose();
    },
  });
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
      <p>Onaylandığında içerik mağazada yayınlanır.</p>
      <p className="text-muted-foreground">
        Reddetmek için bir gerekçe gerekir:{" "}
        <Link to="/admin/approvals" className="text-primary underline">
          Onay bekleyenler
        </Link>{" "}
        sayfasını açın.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <Button
          size="sm"
          disabled={approve.isPending || !detail.data}
          onClick={() => approve.mutate()}
        >
          Onayla
        </Button>
      </div>
    </div>
  );
}
