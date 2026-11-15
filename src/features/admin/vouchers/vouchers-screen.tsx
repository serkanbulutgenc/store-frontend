import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { formatDate, formatTry } from "@/lib/format";
import { ConfirmDeleteDialog } from "../components/delete-confirm";
import type { VoucherRow } from "./form";
import { useVoucherActions, vouchersQuery } from "./queries";
import {
  benefitText,
  expiryText,
  redemptionsText,
  VOUCHER_STATUSES,
  voucherStatusLabel,
  voucherStatusTone,
  voucherToggle,
} from "./rules";
import type { VoucherSearch } from "./search";
import { VoucherForm } from "./voucher-dialog";

const HEADERS = ["Kod", "İndirim", "Alt sınır", "Geçerlilik", "Durum", "Kullanım", ""];

export function VouchersScreen({
  search,
  onSearchChange,
}: {
  search: VoucherSearch;
  onSearchChange: (patch: Partial<VoucherSearch>) => void;
}) {
  const { data } = useSuspenseQuery(vouchersQuery(search.status));
  const [editing, setEditing] = useState<VoucherRow | "new" | null>(null);
  const close = () => setEditing(null);
  const [deleting, setDeleting] = useState<VoucherRow | null>(null);
  const { toggle, remove } = useVoucherActions();
  async function flip(v: VoucherRow) {
    const next = voucherToggle(v.status);
    try {
      await toggle({ id: v.id, action: next.action });
      toast.success(next.success);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Kuponlar</h1>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Duruma göre filtrele"
            className="w-44"
            value={search.status ?? ""}
            onChange={(e) => onSearchChange({ status: e.target.value || undefined })}
          >
            <option value="">Tüm durumlar</option>
            {VOUCHER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {voucherStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => setEditing("new")}>
            Yeni kupon
          </Button>
        </div>
      </div>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {HEADERS.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={HEADERS.length} className="text-center text-muted-foreground">
                  Kupon yok.
                </TableCell>
              </TableRow>
            ) : (
              data.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.code}</TableCell>
                  <TableCell>
                    {benefitText(v.kind, v.value)}
                    {v.once_per_customer && (
                      <span className="block text-xs text-muted-foreground">
                        Müşteri başına bir kez
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatTry(v.minimum)}</TableCell>
                  <TableCell>
                    {formatDate(v.starts_at)} – {expiryText(v.ends_at)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={voucherStatusTone(v.status)}>{voucherStatusLabel(v.status)}</Badge>
                  </TableCell>
                  <TableCell>{redemptionsText(v.redemptions, v.cap)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(v)}>
                        Düzenle
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void flip(v)}>
                        {voucherToggle(v.status).label}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`${v.code} sil`}
                        onClick={() => setDeleting(v)}
                      >
                        Sil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ConfirmDeleteDialog
        target={deleting && { key: deleting.id, name: deleting.code }}
        title="Kuponu sil"
        touches={[]}
        run={() => (deleting ? remove(deleting.id) : Promise.resolve())}
        alternative={
          deleting && deleting.status !== "inactive"
            ? {
                label: "Kapat",
                run: () => toggle({ id: deleting.id, action: "deactivate" }),
                success: "Kupon kapatıldı.",
              }
            : undefined
        }
        onClose={() => setDeleting(null)}
      />
      <Dialog
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "Yeni kupon" : "Kuponu düzenle"}
      >
        {editing !== null && (
          <VoucherForm row={editing === "new" ? undefined : editing} onClose={close} />
        )}
      </Dialog>
    </div>
  );
}
