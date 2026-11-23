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
import {
  type ApprovalItem,
  type FieldDiff,
  fieldLabel,
  formatValue,
  itemKey,
  kindBadge,
} from "./rules";

const HEADERS = ["Tür", "Başlık", "Gönderen", "Tarih", ""];

/** What waits, oldest first. Staff's submitter name is shown so the Owner knows whom to ask. */
export function QueueTable({
  items,
  onReview,
}: {
  items: ApprovalItem[];
  onReview: (item: ApprovalItem) => void;
}) {
  return (
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
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length} className="text-center text-muted-foreground">
                Onay bekleyen bir şey yok.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const badge = kindBadge(item);
              return (
                <TableRow key={itemKey(item)}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>{item.label}</span>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.submitted_by?.name ?? "—"}</TableCell>
                  <TableCell>{item.submitted_at ? formatDate(item.submitted_at) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`${item.title} incele`}
                      onClick={() => onReview(item)}
                    >
                      İncele
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** The live and the waiting text side by side; a field that differs is marked. For a first draft
 * the live column is empty and every field counts as new. */
export function DiffTable({ fields, isChange }: { fields: FieldDiff[]; isChange: boolean }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Alan</TableHead>
            <TableHead>{isChange ? "Yayındaki" : "Şu an"}</TableHead>
            <TableHead>Bekleyen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((f) => (
            <TableRow
              key={f.field}
              data-changed={f.changed}
              className={f.changed ? "bg-amber-50" : ""}
            >
              <TableCell className="font-medium">
                {fieldLabel(f.field)}
                {f.changed && (
                  <Badge tone="warn" className="ml-1.5">
                    Değişti
                  </Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-pre-wrap text-muted-foreground">
                {isChange ? formatValue(f.live) : "—"}
              </TableCell>
              <TableCell className="whitespace-pre-wrap">{formatValue(f.pending)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
