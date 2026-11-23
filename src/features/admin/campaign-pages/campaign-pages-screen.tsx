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
import { formatDate } from "@/lib/format";
import { pageKeys, pagesQuery } from "./queries";
import { PAGE_STATUSES, pageStatusLabel, pageStatusTone } from "./rules";
import type { PageSearch } from "./search";

const HEADERS = ["Başlık", "Durum", "Tarihler", "Kampanya", ""];

const range = (start: string | null, end: string | null) =>
  start || end ? `${start ? formatDate(start) : "…"} – ${end ? formatDate(end) : "…"}` : "—";

export function CampaignPagesScreen({
  search,
  onSearchChange,
}: {
  search: PageSearch;
  onSearchChange: (patch: Partial<PageSearch>) => void;
}) {
  const { data } = useSuspenseQuery(pagesQuery(search.status));
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Kampanya sayfaları</h1>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Duruma göre filtrele"
            className="w-48"
            value={search.status ?? ""}
            onChange={(e) =>
              onSearchChange({ status: (e.target.value || undefined) as PageSearch["status"] })
            }
          >
            <option value="">Tüm durumlar</option>
            {PAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {pageStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => setCreating(true)}>
            Yeni kampanya sayfası
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
                  Kampanya sayfası yok.
                </TableCell>
              </TableRow>
            ) : (
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      to="/admin/campaign-pages/$pageId"
                      params={{ pageId: String(p.id) }}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">
                      /kampanyalar/{p.slug}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={pageStatusTone(p.status)}>{pageStatusLabel(p.status)}</Badge>
                      {p.has_pending_change && <Badge tone="warn">Bekleyen değişiklik</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{range(p.starts_at, p.ends_at)}</TableCell>
                  <TableCell>{p.campaign?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/admin/campaign-pages/$pageId"
                        params={{ pageId: String(p.id) }}
                        aria-label={`${p.title} düzenle`}
                      >
                        Düzenle
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={creating} onClose={() => setCreating(false)} title="Yeni kampanya sayfası">
        {creating && <CreateForm onClose={() => setCreating(false)} />}
      </Dialog>
    </div>
  );
}

/** A title is all a draft needs; the rest is set on its own page. */
function CreateForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async () =>
      (
        await adminApi.POST("/api/admin/campaign-pages", {
          body: { title: title.trim(), description: "" },
        })
      ).data,
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: pageKeys.all });
      onClose();
      if (created)
        await navigate({
          to: "/admin/campaign-pages/$pageId",
          params: { pageId: String(created.id) },
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
        <label htmlFor="campaign-page-title" className="block font-medium">
          Başlık
        </label>
        <Input
          id="campaign-page-title"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" size="sm" disabled={create.isPending || title.trim() === ""}>
          Oluştur
        </Button>
      </div>
    </form>
  );
}
