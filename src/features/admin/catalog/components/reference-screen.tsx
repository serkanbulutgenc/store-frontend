import { useForm } from "@tanstack/react-form";
import { type ReactNode, useEffect, useRef, useState } from "react";
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
import { ConfirmDeleteDialog } from "../../components/delete-confirm";
import { apiErrorToFormErrors } from "../../forms/api-errors";
import { bind, Field, FormActions, FormMessage } from "../../forms/field";
import { ColourField } from "./colour-field";

export type FieldDef = {
  name: string;
  label: string;
  kind?: "text" | "select" | "colour";
  options?: { value: string; label: string }[];
  hint?: string;
  /** Only shown when creating (the API cannot change it afterwards). */
  createOnly?: boolean;
  /** Only shown when editing (the API cannot set it on create). */
  editOnly?: boolean;
};

/** An optional image (a Brand's logo) in the dialog. It is uploaded after the row is saved, so
 * `save` must then resolve to `{ id }` for a new row. */
export type ImageFieldDef<Row> = {
  label: string;
  /** Names the file input for assistive tech and tests. */
  inputLabel: string;
  accept: string;
  /** A reason to refuse the file before it is sent, or null. */
  validate: (file: File) => string | null;
  upload: (id: number, file: File) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  current: (row: Row) => { url: string | null; status: string; error: string } | null;
};

export type ReferenceProps<Row extends { id: number; name: string }> = {
  title: string;
  singular: string;
  rows: Row[];
  canManage: boolean;
  /** Owner-only (`delete_catalogue`): shows the delete button. The API enforces it. */
  canDelete?: boolean;
  columns: { header: string; cell: (row: Row) => ReactNode }[];
  fields: FieldDef[];
  schema: z.ZodType<Record<string, string>, Record<string, string>>;
  defaults: (row?: Row) => Record<string, string>;
  save: (values: Record<string, string>, row?: Row) => Promise<unknown>;
  /** Extra per-row controls, shown before "Düzenle" (for example a link to a detail page). */
  rowActions?: (row: Row) => ReactNode;
  image?: ImageFieldDef<Row>;
  /** Fields the API will not change for this row, with the reason shown under the field. */
  lockedFields?: (row: Row) => Record<string, string>;
  /** Delete button per row, through the shared confirm dialog. The backend's refusal names
   * what blocks it; `alternative` is offered after a refusal (Deactivate a Colour in use). */
  remove?: {
    /** What the delete touches, e.g. "3 ürün". */
    touches?: (row: Row) => string[];
    /** Menu items pointing at the row, which block its delete (ADR 0007). */
    menuItemCount?: (row: Row) => number | undefined;
    run: (row: Row) => Promise<unknown>;
    alternative?: (row: Row) => { label: string; run: () => Promise<unknown>; success: string };
  };
};

/** A small list with a create/edit dialog, for the reference data that has no paging or search. */
export function ReferenceScreen<Row extends { id: number; name: string }>(
  props: ReferenceProps<Row>,
) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const close = () => setEditing(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const { remove } = props;
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
                        {props.rowActions?.(row)}
                        <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                          Düzenle
                        </Button>
                        {remove && props.canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`${row.name} sil`}
                            onClick={() => setDeleting(row)}
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
      {remove && (
        <ConfirmDeleteDialog
          target={deleting && { key: deleting.id, name: deleting.name }}
          title={`${props.singular.charAt(0).toLocaleUpperCase("tr")}${props.singular.slice(1)} sil`}
          touches={deleting ? (remove.touches?.(deleting) ?? []) : []}
          menuItemCount={deleting ? remove.menuItemCount?.(deleting) : undefined}
          run={() => (deleting ? remove.run(deleting) : Promise.resolve())}
          alternative={deleting ? remove.alternative?.(deleting) : undefined}
          onClose={() => setDeleting(null)}
        />
      )}
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

function RefForm<Row extends { id: number; name: string }>({
  row,
  onClose,
  ...props
}: ReferenceProps<Row> & { row?: Row; onClose: () => void }) {
  const { image } = props;
  const [file, setFile] = useState<File | null>(null);
  const [removeCurrent, setRemoveCurrent] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const imageFailed = useRef(false);
  const form = useForm({
    defaultValues: props.defaults(row),
    validators: {
      onSubmit: props.schema,
      onSubmitAsync: async ({ value }) => {
        let saved: unknown;
        try {
          saved = await props.save(props.schema.parse(value), row);
        } catch (e) {
          return apiErrorToFormErrors(e);
        }
        // The row is saved; a failed image step must not make Save look like it failed
        // (saving again would create the row twice), so it is reported on its own.
        const id = row?.id ?? (saved as { id?: number } | undefined)?.id;
        if (image && id !== undefined && (file || removeCurrent)) {
          try {
            await (file ? image.upload(id, file) : image.remove(id));
          } catch (e) {
            imageFailed.current = true;
            const reason = apiErrorToFormErrors(e);
            toast.error(
              `Kaydedildi, ancak ${image.label.toLocaleLowerCase("tr")} güncellenemedi: ${
                typeof reason === "string" ? reason : (reason.form ?? "Hata oluştu.")
              }`,
            );
          }
        }
        return undefined;
      },
    },
    onSubmit: () => {
      if (!imageFailed.current) toast.success("Kaydedildi.");
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
                ) : def.kind === "colour" ? (
                  <ColourField bound={bind(f)} disabled={def.name in locked} />
                ) : (
                  <Input autoFocus={i === 0} {...bind(f)} disabled={def.name in locked} />
                )}
              </Field>
            )}
          </form.Field>
        ))}
      {image && (
        <ImageInput
          def={image}
          current={row ? image.current(row) : null}
          file={file}
          removed={removeCurrent}
          error={fileError}
          onPick={(picked) => {
            const problem = image.validate(picked);
            setFileError(problem);
            if (!problem) {
              setFile(picked);
              setRemoveCurrent(false);
            }
          }}
          onClearFile={() => setFile(null)}
          onToggleRemove={() => setRemoveCurrent((r) => !r)}
        />
      )}
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(err) => <FormMessage error={err} />}
      </form.Subscribe>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(submitting) => <FormActions submitting={submitting} onClose={onClose} />}
      </form.Subscribe>
    </form>
  );
}

function ImageInput<Row>({
  def,
  current,
  file,
  removed,
  error,
  onPick,
  onClearFile,
  onToggleRemove,
}: {
  def: ImageFieldDef<Row>;
  current: ReturnType<ImageFieldDef<Row>["current"]>;
  file: File | null;
  removed: boolean;
  error: string | null;
  onPick: (file: File) => void;
  onClearFile: () => void;
  onToggleRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const shown = preview ?? (removed ? null : (current?.url ?? null));
  const has = current !== null && !removed;
  return (
    <div className="space-y-1.5">
      <span className="block font-medium">{def.label}</span>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-24 items-center justify-center rounded-md border border-border bg-card text-xs text-muted-foreground">
          {shown ? (
            <img src={shown} alt="" className="max-h-full max-w-full object-contain" />
          ) : removed ? (
            "Kaldırılacak"
          ) : current?.status === "processing" ? (
            "İşleniyor…"
          ) : current?.status === "failed" ? (
            "İşlenemedi"
          ) : (
            "Yok"
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-1.5 hover:bg-accent">
            {has || file ? "Değiştir" : `${def.label} seç`}
            <input
              type="file"
              aria-label={def.inputLabel}
              accept={def.accept}
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                e.target.value = "";
                if (picked) onPick(picked);
              }}
            />
          </label>
          {file ? (
            <Button type="button" variant="outline" size="sm" onClick={onClearFile}>
              Seçimi geri al
            </Button>
          ) : (
            current && (
              <Button type="button" variant="outline" size="sm" onClick={onToggleRemove}>
                {removed ? "Kaldırmayı geri al" : "Kaldır"}
              </Button>
            )
          )}
        </div>
      </div>
      {error && (
        <span role="alert" className="block text-red-700">
          {error}
        </span>
      )}
      {current?.status === "failed" && !file && (
        <span role="alert" className="block text-red-700">
          Logo işlenemedi; başka bir dosya yükleyin.
        </span>
      )}
    </div>
  );
}
