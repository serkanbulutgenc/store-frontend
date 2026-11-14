import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/errors";
import { can, type Me } from "@/lib/api/me";

export type DeleteAttempt = { ok: true } | { ok: false; error: string };

/** Runs a delete; a refusal comes back as the message to show, never thrown. */
export async function attemptDelete(run: () => Promise<unknown>): Promise<DeleteAttempt> {
  try {
    await run();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.",
    };
  }
}

/** For deletes the backend answers with `confirmation_required` and the impact: the first
 * call fails with that message (shown in the dialog), the next one repeats with `confirm`. */
export function twoStepDelete(run: (confirm: boolean) => Promise<unknown>) {
  let armed = false;
  return async () => {
    try {
      await run(armed);
    } catch (e) {
      if (e instanceof ApiError && e.code === "confirmation_required") armed = true;
      throw e;
    }
  };
}

export type DeleteConfirmBodyProps = {
  name: string;
  /** What the delete touches, e.g. "3 ürün". */
  touches: string[];
  /** The backend's refusal, which names what blocks the delete. */
  error: string | null;
  pending: boolean;
  /** A softer option (Archive, Deactivate), offered once the delete was refused. */
  alternative?: { label: string; run: () => void };
  onConfirm: () => void;
  onCancel: () => void;
};

/** The body of the shared delete confirmation (ADR 0005). */
export function DeleteConfirmBody({
  name,
  touches,
  error,
  pending,
  alternative,
  onConfirm,
  onCancel,
}: DeleteConfirmBodyProps) {
  return (
    <div className="space-y-3 text-sm">
      <p>
        <strong>{name}</strong> kalıcı olarak silinir
        {touches.length > 0 && ` (${touches.join(", ")})`}.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
        {error && alternative && (
          <Button type="button" variant="outline" disabled={pending} onClick={alternative.run}>
            {alternative.label}
          </Button>
        )}
        <Button type="button" disabled={pending} onClick={onConfirm}>
          Sil
        </Button>
      </div>
    </div>
  );
}

/** The shared delete dialog. Stays open with the backend's reason when a delete is refused;
 * on success it reports, runs `onDeleted` (the list refresh) and closes. */
export function ConfirmDeleteDialog({
  target,
  title,
  touches,
  run,
  onDeleted,
  onClose,
  success = "Silindi.",
  alternative,
}: {
  /** The item being deleted; `null` keeps the dialog closed. */
  target: { key: string | number; name: string } | null;
  title: string;
  touches: string[];
  run: () => Promise<unknown>;
  /** The list refresh, when the `run` mutation does not already do it. */
  onDeleted?: () => unknown;
  onClose: () => void;
  success?: string;
  /** Offered after a refusal instead of the delete, e.g. Archive a Product with Orders. */
  alternative?: { label: string; run: () => Promise<unknown>; success: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const close = () => {
    setError(null);
    onClose();
  };
  async function perform(action: () => Promise<unknown>, done: string, deleted: boolean) {
    setPending(true);
    const result = await attemptDelete(action);
    setPending(false);
    if (!result.ok) return setError(result.error);
    if (deleted) await onDeleted?.();
    toast.success(done);
    close();
  }
  return (
    <Dialog open={target !== null} onClose={close} title={title}>
      {target && (
        <div key={target.key} className="space-y-3">
          <DeleteConfirmBody
            name={target.name}
            touches={touches}
            error={error}
            pending={pending}
            alternative={
              alternative && {
                label: alternative.label,
                run: () => void perform(alternative.run, alternative.success, false),
              }
            }
            onConfirm={() => void perform(run, success, true)}
            onCancel={close}
          />
        </div>
      )}
    </Dialog>
  );
}

/** A delete button and its confirmation, for whoever holds `delete_catalogue` (the Owner).
 * Nothing renders for anyone else; the API enforces the permission too. */
export function DeleteAction({
  me,
  name,
  title,
  touches = [],
  run,
  onDeleted,
  alternative,
  success,
  label = "Sil",
}: {
  me: Me;
  name: string;
  title: string;
  touches?: string[];
  run: () => Promise<unknown>;
  onDeleted?: () => unknown;
  alternative?: { label: string; run: () => Promise<unknown>; success: string };
  success?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!can(me, "delete_catalogue")) return null;
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={`${name} sil`}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <ConfirmDeleteDialog
        target={open ? { key: name, name } : null}
        title={title}
        touches={touches}
        run={run}
        onDeleted={onDeleted}
        alternative={alternative}
        success={success}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
