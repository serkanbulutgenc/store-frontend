import { Select } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "./delete-confirm";
import type { ToggleCall } from "./row-actions";

/** The "Duruma göre filtrele" select above a list of rows that have a status. */
export function StatusFilter({
  statuses,
  label,
  value,
  onChange,
}: {
  statuses: string[];
  label: (status: string) => string;
  value: string | undefined;
  onChange: (status: string | undefined) => void;
}) {
  return (
    <Select
      aria-label="Duruma göre filtrele"
      className="w-44"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">Tüm durumlar</option>
      {statuses.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </Select>
  );
}

/**
 * Delete a row after the shared confirmation (ADR 0005). A row that is in use is refused by
 * the API, so the dialog then offers to close it instead, unless it is closed already.
 */
export function RowDeleteDialog({
  row,
  name,
  title,
  closedMessage,
  toggle,
  remove,
  onClose,
}: {
  row: { id: number; status: string } | null;
  name: string | undefined;
  title: string;
  closedMessage: string;
  toggle: ToggleCall;
  remove: (id: number) => Promise<unknown>;
  onClose: () => void;
}) {
  return (
    <ConfirmDeleteDialog
      target={row && { key: row.id, name: name ?? "" }}
      title={title}
      touches={[]}
      run={() => (row ? remove(row.id) : Promise.resolve())}
      alternative={
        row && row.status !== "inactive"
          ? {
              label: "Kapat",
              run: () => toggle({ id: row.id, action: "deactivate" }),
              success: closedMessage,
            }
          : undefined
      }
      onClose={onClose}
    />
  );
}
