import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { type OrderAccess, type TrackedOrder, useOrderActions } from "../queries";
import {
  RETURN_REASONS,
  reasonLabel,
  returnAvailability,
  returnBody,
  returnShippingNote,
  returnStatusLabel,
} from "../returns";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "İşlem şu anda yapılamadı. Lütfen tekrar deneyin.";

function CancelOrder({ access }: { access: OrderAccess }) {
  const { cancel } = useOrderActions(access);
  const [confirming, setConfirming] = useState(false);
  return (
    <section
      aria-labelledby="cancel"
      className="space-y-2 rounded-md border border-border bg-card p-4"
    >
      <h2 id="cancel" className="font-semibold">
        Siparişi iptal et
      </h2>
      <p className="text-muted-foreground">
        Siparişiniz kargoya verilmeden önce iptal edebilirsiniz. Ödeme yaptıysanız iade için sizinle
        iletişime geçeriz.
      </p>
      {cancel.isError && (
        <p role="alert" className="text-red-700">
          {message(cancel.error)}
        </p>
      )}
      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={cancel.isPending} onClick={() => cancel.mutate()}>
            Evet, siparişi iptal et
          </Button>
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Vazgeç
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setConfirming(true)}>
          Siparişi iptal et
        </Button>
      )}
    </section>
  );
}

function ReturnForm({ order, access }: { order: TrackedOrder; access: OrderAccess }) {
  const { requestReturn } = useOrderActions(access);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [reason, setReason] = useState<(typeof RETURN_REASONS)[number]["value"]>("wrong_size");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const body = returnBody(quantities, reason, note);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        requestReturn.mutate(body, {
          onSuccess: () => {
            setSent(true);
            setQuantities({});
            setNote("");
          },
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="font-medium">İade etmek istediğiniz ürünler</legend>
        {order.lines.map((l) => {
          const max = l.returnable_quantity;
          const ticked = (quantities[l.id] ?? 0) > 0;
          return (
            <div key={l.id} className="flex items-center justify-between gap-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={ticked}
                  disabled={max === 0}
                  onChange={(e) =>
                    setQuantities({ ...quantities, [l.id]: e.target.checked ? 1 : 0 })
                  }
                />
                <span>
                  {l.title}
                  <span className="block text-muted-foreground">
                    {l.colour} · {l.size}
                  </span>
                  {max === 0 && (
                    <span className="block text-muted-foreground">
                      İade edilemez (hijyen ürünü ya da iade talebi zaten var).
                    </span>
                  )}
                </span>
              </label>
              {ticked && (
                <select
                  aria-label={`${l.title} iade adedi`}
                  className="h-9 rounded-md border border-input bg-transparent px-2"
                  value={quantities[l.id]}
                  onChange={(e) => setQuantities({ ...quantities, [l.id]: Number(e.target.value) })}
                >
                  {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} adet
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </fieldset>
      <div className="space-y-1">
        <label htmlFor="return-reason" className="block font-medium">
          İade nedeni
        </label>
        <select
          id="return-reason"
          aria-describedby="return-shipping"
          className="h-11 w-full rounded-md border border-input bg-transparent px-3"
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
        >
          {RETURN_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <span id="return-shipping" aria-live="polite" className="block text-muted-foreground">
          {returnShippingNote(reason)}
        </span>
      </div>
      <div className="space-y-1">
        <label htmlFor="return-note" className="block font-medium">
          Not (isteğe bağlı)
        </label>
        <Textarea
          id="return-note"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {sent && !requestReturn.isPending && !requestReturn.isError && (
        <p role="status" className="text-muted-foreground">
          İade talebiniz alındı. Sonucu e-posta ile bildireceğiz.
        </p>
      )}
      {requestReturn.isError && (
        <p role="alert" className="text-red-700">
          {message(requestReturn.error)}
        </p>
      )}
      <Button type="submit" size="lg" disabled={requestReturn.isPending || body.lines.length === 0}>
        İade talebi gönder
      </Button>
    </form>
  );
}

function ReturnList({ order }: { order: TrackedOrder }) {
  if (order.returns.length === 0) return null;
  return (
    <ul className="space-y-3">
      {order.returns.map((r) => (
        <li key={r.id} className="space-y-1 rounded-md bg-muted px-3 py-2">
          <p className="font-medium">
            {formatDate(r.requested_at)} · {returnStatusLabel(r.status)}
          </p>
          <ul>
            {r.lines.map((l) => (
              <li key={l.line_id}>
                {l.quantity} × {l.title}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Neden: {reasonLabel(r.reason)}
            {r.status !== "rejected" && ` · ${returnShippingNote(r.reason)}`}
          </p>
          {r.status === "rejected" && (
            <p className="text-muted-foreground">
              Talebiniz kabul edilemedi; nedeni e-postanızda yazıyor.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReturnSection({ order, access }: { order: TrackedOrder; access: OrderAccess }) {
  const availability = returnAvailability(order);
  if (availability.kind === "none" && order.returns.length === 0) return null;
  return (
    <section
      aria-labelledby="returns"
      className="space-y-3 rounded-md border border-border bg-card p-4"
    >
      <h2 id="returns" className="font-semibold">
        İade
      </h2>
      <ReturnList order={order} />
      {availability.kind === "open" && (
        <>
          <p className="text-muted-foreground">
            Teslimattan sonra 14 gün içinde iade talep edebilirsiniz (son gün:{" "}
            {formatDate(availability.until)}).
          </p>
          <ReturnForm order={order} access={access} />
        </>
      )}
      {availability.kind === "closed" && (
        <p className="text-muted-foreground">
          İade süresi (teslimattan sonra 14 gün) dolduğu için yeni iade talebi yapılamıyor.
        </p>
      )}
      {availability.kind === "nothing_left" && (
        <p className="text-muted-foreground">Bu siparişte iade talep edilebilecek ürün kalmadı.</p>
      )}
    </section>
  );
}

/** Cancel (before shipping) and return requests (after delivery) for one Order. */
export function OrderActions({ order, access }: { order: TrackedOrder; access: OrderAccess }) {
  return (
    <>
      {order.can_cancel && <CancelOrder access={access} />}
      <ReturnSection order={order} access={access} />
    </>
  );
}
