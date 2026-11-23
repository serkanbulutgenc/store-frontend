import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { pagesQuery } from "./queries";
import { PAGE_STATUSES, pageStatusLabel, pageStatusTone } from "./rules";
import type { PageSearch } from "./search";

const HEADERS = ["Başlık", "Durum", "Tarihler", "Kampanya", ""];

const range = (start: string | null, end: string | null) =>
  start || end ? `${start ? formatDate(start) : "…"} – ${end ? formatDate(end) : "…"}` : "—";

/** The Campaign pages tab of the Kampanyalar screen. */
export function CampaignPagesTab({
  status,
  onStatusChange,
}: {
  status: PageSearch["status"];
  onStatusChange: (status: PageSearch["status"]) => void;
}) {
  const { data } = useSuspenseQuery(pagesQuery(status));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <Select
            aria-label="Duruma göre filtrele"
            className="w-48"
            value={status ?? ""}
            onChange={(e) => onStatusChange((e.target.value || undefined) as PageSearch["status"])}
          >
            <option value="">Tüm durumlar</option>
            {PAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {pageStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Button size="sm" asChild>
            <Link to="/admin/campaign-pages/new">Yeni kampanya sayfası</Link>
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
    </div>
  );
}
