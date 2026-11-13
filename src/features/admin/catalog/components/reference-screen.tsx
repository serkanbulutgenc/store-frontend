import { useForm } from "@tanstack/react-form";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
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
import { ApiError } from "@/lib/api/errors";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../../forms/field";

export type FieldDef = {
  name: string;
  label: string;
  kind?: "text" | "select";
  options?: { value: string; label: string }[];
  hint?: string;
  /** Only shown when creating (the API cannot change it afterwards). */
  createOnly?: boolean;
  /** Only shown when editing (the API cannot set it on create). */
  editOnly?: boolean;
};

export type ReferenceProps<Row extends { id: number }> = {
  title: string;
  singular: string;
  rows: Row[];
  canManage: boolean;
  columns: { header: string; cell: (row: Row) => ReactNode }[];
  fields: FieldDef[];
  schema: z.ZodType<Record<string, string>, Record<string, string>>;
  defaults: (row?: Row) => Record<string, string>;
  save: (values: Record<string, string>, row?: Row) => Promise<unknown>;
  /** Fields the API will not change for this row, with the reason shown under the field. */
  lockedFields?: (row: Row) => Record<string, string>;
  /** Delete button per row. `blocked` returns why the row cannot be deleted, if so. */
  remove?: {
    blocked: (row: Row) => string | undefined;
    confirm: (row: Row) => string;
    run: (row: Row) => Promise<unknown>;
  };
};

/** A small list with a create/edit dialog, for the reference data that has no paging or search. */
export function ReferenceScreen<Row extends { id: number }>(props: ReferenceProps<Row>) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const close = () => setEditing(null);
  const { remove } = props;
  async function onRemove(row: Row, run: (row: Row) => Promise<unknown>, message: string) {
    if (!window.confirm(message)) return;
    try {
      await run(row);
      toast.success("Silindi.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{props.title}</h1>
        {props.canManage && (
          <Button size="sm" onClick={() => setEditing("new")}>
            Yeni {props.singular}
          </Button>
        )}
      </div>
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {props.columns.map((c) => (
                <TableHead key={c.header}>{c.header}</TableHead>
              ))}
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={props.columns.length + 1}
                  className="text-center text-muted-foreground"
                >
                  Kayıt yok.
                </TableCell>
              </TableRow>
            ) : (
              props.rows.map((row) => (
                <TableRow key={row.id}>
                  {props.columns.map((c) => (
                    <TableCell key={c.header}>{c.cell(row)}</TableCell>
                  ))}
                  <TableCell>
                    {props.canManage && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                          Düzenle
                        </Button>
                        {remove && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={remove.blocked(row) !== undefined}
                            title={remove.blocked(row)}
                            onClick={() => onRemove(row, remove.run, remove.confirm(row))}
                          >
                            Sil
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? `Yeni ${props.singular}` : `${props.singular} düzenle`}
      >
        {editing !== null && (
          <RefForm {...props} row={editing === "new" ? undefined : editing} onClose={close} />
        )}
      </Dialog>
    </div>
  );
}

function RefForm<Row extends { id: number }>({
  row,
  onClose,
  ...props
}: ReferenceProps<Row> & { row?: Row; onClose: () => void }) {
  const form = useForm({
    defaultValues: props.defaults(row),
    validators: {
      onSubmit: props.schema,
      onSubmitAsync: async ({ value }) => {
        try {
          await props.save(props.schema.parse(value), row);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        return undefined;
      },
    },
    onSubmit: () => {
      toast.success("Kaydedildi.");
      onClose();
    },
  });
  const locked = row ? (props.lockedFields?.(row) ?? {}) : {};
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      {props.fields
        .filter((f) => !(f.createOnly && row) && !(f.editOnly && !row))
        .map((def, i) => (
          <form.Field key={def.name} name={def.name}>
            {(f) => (
              <Field field={f} label={def.label} hint={locked[def.name] ?? def.hint}>
                {def.kind === "select" ? (
                  <Select {...bind(f)} autoFocus={i === 0} disabled={def.name in locked}>
                    {def.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input autoFocus={i === 0} {...bind(f)} disabled={def.name in locked} />
                )}
              </Field>
            )}
          </form.Field>
        ))}
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => <FormActions submitting={submitting} onClose={onClose} />}
      </form.Subscribe>
    </form>
  );
}
