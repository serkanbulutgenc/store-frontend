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
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormMessage } from "../../forms/field";

export type FieldDef = {
  name: string;
  label: string;
  kind?: "text" | "select";
  options?: { value: string; label: string }[];
  hint?: string;
  /** Only shown when creating (the API cannot change it afterwards). */
  createOnly?: boolean;
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
};

/** A small list with a create/edit dialog, for the reference data that has no paging or search. */
export function ReferenceScreen<Row extends { id: number }>(props: ReferenceProps<Row>) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const close = () => setEditing(null);
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
                      <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                        Düzenle
                      </Button>
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
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      {props.fields
        .filter((f) => !(f.createOnly && row))
        .map((def, i) => (
          <form.Field key={def.name} name={def.name}>
            {(f) => (
              <Field field={f} label={def.label} hint={def.hint}>
                {def.kind === "select" ? (
                  <Select {...bind(f)} autoFocus={i === 0}>
                    {def.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input autoFocus={i === 0} {...bind(f)} />
                )}
              </Field>
            )}
          </form.Field>
        ))}
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(sub) => (
            <Button type="submit" size="sm" disabled={sub}>
              Kaydet
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
