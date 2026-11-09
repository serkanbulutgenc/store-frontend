import { type ReactNode, useEffect, useRef } from "react";

/** Modal on the native <dialog>: focus trap, Esc to close and a backdrop come for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="m-auto w-full max-w-md rounded-md border border-border bg-card p-0 text-foreground backdrop:bg-black/40"
    >
      {open && (
        <div className="space-y-3 p-4">
          <h2 id="dialog-title" className="text-base font-semibold">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
