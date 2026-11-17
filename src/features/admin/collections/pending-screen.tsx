import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { formatDate } from "@/lib/format";
import { pendingCollectionsQuery } from "./queries";
import { PENDING_KIND_LABEL, pendingKind } from "./rules";

const HEADERS = ["Ad", "Tür", "Gönderen", "Gönderim tarihi", ""];

/** The Owner's queue: first submissions and changes to published Collections. Approving or
 * rejecting happens on the Collection's page, which shows what differs from the live version. */
export function PendingCollectionsScreen() {
  const { data } = useSuspenseQuery(pendingCollectionsQuery());
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Onay bekleyen koleksiyonlar</h1>
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
                  Onay bekleyen koleksiyon yok.
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => {
                const kind = pendingKind({
                  status: c.status,
                  hasPendingChange: c.has_pending_change,
                });
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to="/admin/collections/$collectionId"
                        params={{ collectionId: String(c.id) }}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {kind && <Badge tone="warn">{PENDING_KIND_LABEL[kind]}</Badge>}
                    </TableCell>
                    <TableCell>{c.submitted_by?.name ?? "—"}</TableCell>
                    <TableCell>{c.submitted_at ? formatDate(c.submitted_at) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to="/admin/collections/$collectionId"
                          params={{ collectionId: String(c.id) }}
                          aria-label={`${c.name} incele`}
                        >
                          İncele
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
