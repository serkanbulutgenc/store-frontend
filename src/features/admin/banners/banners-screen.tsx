import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import type { Me } from "@/lib/api/me";
import { formatDate } from "@/lib/format";
import { VitrinTabs } from "../homepage/vitrin-tabs";
import { DeleteBannerButton } from "./delete-banner-button";
import { bannerKeys, bannersQuery } from "./queries";
import {
  canDelete,
  isImageSlot,
  MESSAGE_MAX,
  SLOT_KEYS,
  type Slot,
  STATUSES,
  slotLabel,
  statusLabel,
  statusTone,
} from "./rules";
import type { BannerSearch } from "./search";

const HEADERS = ["Banner", "Alan", "Durum", "Sıra", "Tarihler", ""];

const range = (start: string | null, end: string | null) =>
  start || end ? `${start ? formatDate(start) : "…"} – ${end ? formatDate(end) : "…"}` : "—";

export function BannersScreen({
  me,
  search,
  onSearchChange,
  owner,
}: {
  me: Me;
  owner: boolean;
  search: BannerSearch;
  onSearchChange: (patch: Partial<BannerSearch>) => void;
}) {
  const { data } = useSuspenseQuery(bannersQuery(search.status, search.slot));
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-3">
      <VitrinTabs me={me} active={search.slot ?? null} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">{search.slot ? "Vitrin" : "Banner'lar"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Duruma göre filtrele"
            className="w-48"
            value={search.status ?? ""}
            onChange={(e) =>
              onSearchChange({ status: (e.target.value || undefined) as BannerSearch["status"] })
            }
          >
            <option value="">Tüm durumlar</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => setCreating(true)}>
            Yeni banner
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
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
                  Banner yok.
                </TableCell>
              </TableRow>
            ) : (
              data.map((b) => {
                const name = b.message || `${slotLabel(b.slot)} #${b.id}`;
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link
                        to="/admin/banners/$bannerId"
                        params={{ bannerId: String(b.id) }}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {name}
                      </Link>
                      {b.category && (
                        <span className="block text-xs text-muted-foreground">
                          {b.category.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{slotLabel(b.slot)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={statusTone(b.status)}>{statusLabel(b.status)}</Badge>
                        {b.has_pending_change && <Badge tone="warn">Bekleyen değişiklik</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{b.position}</TableCell>
                    <TableCell>{range(b.starts_at, b.ends_at)}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to="/admin/banners/$bannerId"
                          params={{ bannerId: String(b.id) }}
                          aria-label={`${name} düzenle`}
                        >
                          Düzenle
                        </Link>
                      </Button>
                      {canDelete(
                        { status: b.status as never, hasPendingChange: b.has_pending_change },
                        { owner, submitter: false },
                      ) && <DeleteBannerButton id={b.id} name={name} />}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={creating} onClose={() => setCreating(false)} title="Yeni banner">
        {creating && (
          <CreateForm
            initialSlot={search.slot ?? "category_top"}
            onClose={() => setCreating(false)}
          />
        )}
      </Dialog>
    </div>
  );
}

/** A slot (and, for the announcement bar, its message) is all a draft needs; the rest is
 * set on its own page. */
function CreateForm({ initialSlot, onClose }: { initialSlot: Slot; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<Slot>(initialSlot);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textual = !isImageSlot(slot);
  const create = useMutation({
    mutationFn: async () =>
      (
        await adminApi.POST("/api/admin/banners", {
          body: { slot, message: textual ? message.trim() : "", link: "", position: 0 },
        })
      ).data,
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: bannerKeys.all });
      onClose();
      if (created)
        await navigate({
          to: "/admin/banners/$bannerId",
          params: { bannerId: String(created.id) },
        });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu."),
  });
  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        create.mutate();
      }}
    >
      <div className="space-y-1">
        <label htmlFor="banner-slot" className="block font-medium">
          Alan
        </label>
        <Select id="banner-slot" value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>
          {SLOT_KEYS.map((s) => (
            <option key={s} value={s}>
              {slotLabel(s)}
            </option>
          ))}
        </Select>
      </div>
      {textual && (
        <div className="space-y-1">
          <label htmlFor="banner-message" className="block font-medium">
            Mesaj
          </label>
          <Input
            id="banner-message"
            value={message}
            maxLength={MESSAGE_MAX}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={create.isPending || (textual && message.trim() === "")}
        >
          Oluştur
        </Button>
      </div>
    </form>
  );
}
