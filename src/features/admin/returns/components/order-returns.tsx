import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { formatDate, formatTry } from "@/lib/format";
import { ActionDialog } from "../../forms/action-dialog";
import { refundFormSchema } from "../../orders/schemas";
import {
  type OrderDetail,
  type ReturnAdmin,
  useApproveReturn,
  useReceiveReturn,
  useRefundReturn,
  useRejectReturn,
} from "../queries";
import {
  RESTOCK_OPTIONS,
  type ReturnStep,
  receiveBody,
  returnReasonLabel,
  returnStatusLabel,
  returnStatusTone,
  returnSteps,
  STEP_LABEL,
} from "../rules";
import { receiveFormSchema, rejectFormSchema } from "../schemas";

/** Customer return requests on the Order detail, with the review steps. */
export function OrderReturns({ order, me }: { order: OrderDetail; me: Me }) {
  const [dialog, setDialog] = useState<{ step: ReturnStep; request: ReturnAdmin } | null>(null);
  const approve = useApproveReturn();
  const reject = useRejectReturn();
  const receive = useReceiveReturn();
  const refund = useRefundReturn();
  const number = order.number;
  const close = () => setDialog(null);

  if (order.returns.length === 0) return null;

  const allowed = (step: ReturnStep) =>
    step === "refund" ? can(me, "record_refunds") : can(me, "manage_orders");

  async function onStep(step: ReturnStep, request: ReturnAdmin) {
    if (step !== "approve") return setDialog({ step, request });
    try {
      await approve.mutateAsync({ number, id: request.id });
      toast.success("İade talebi onaylandı.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem yapılamadı.");
    }
  }

  const current = dialog?.request;
  return (
    <section className="space-y-3" aria-labelledby="customer-returns">
      <h2 id="customer-returns" className="text-base font-semibold">
        Müşteri iade talepleri
      </h2>
      {order.returns.map((r) => (
        <article key={r.id} className="space-y-2 rounded-md border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={returnStatusTone(r.status)}>{returnStatusLabel(r.status)}</Badge>
            <span>{returnReasonLabel(r.reason)}</span>
            <span className="text-muted-foreground">{formatDate(r.requested_at)}</span>
            <span className="text-muted-foreground">
              · İade kargo ücretini {r.shop_pays_shipping ? "mağaza" : "müşteri"} öder
            </span>
          </div>
          {r.note && <p className="text-muted-foreground">Müşteri notu: {r.note}</p>}
          <ul>
            {r.lines.map((l) => (
              <li key={l.line_id}>
                {l.quantity} × {l.title}
                {l.restocked && <span className="text-muted-foreground"> · stoğa eklendi</span>}
              </li>
            ))}
          </ul>
          {r.reject_reason && (
            <p className="text-muted-foreground">Ret nedeni: {r.reject_reason}</p>
          )}
          {r.refund_amount && (
            <p className="text-muted-foreground">
              Ödenen iade: {formatTry(r.refund_amount)}
              {r.refunded_at ? ` · ${formatDate(r.refunded_at)}` : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {returnSteps(r.status)
              .filter(allowed)
              .map((step) => (
                <Button
                  key={step}
                  size="sm"
                  variant={step === "reject" ? "outline" : "default"}
                  disabled={approve.isPending}
                  onClick={() => void onStep(step, r)}
                >
                  {STEP_LABEL[step]}
                </Button>
              ))}
          </div>
        </article>
      ))}

      <ActionDialog
        open={dialog?.step === "reject"}
        title="İade talebini reddet"
        intro="Neden müşteriye e-postayla gönderilir."
        fields={[{ name: "reason", label: "Ret nedeni" }]}
        defaults={{ reason: "" }}
        schema={rejectFormSchema}
        success="İade talebi reddedildi."
        submit={(v) => reject.mutateAsync({ number, id: current?.id ?? 0, body: v })}
        onClose={close}
      />
      <ActionDialog
        open={dialog?.step === "receive"}
        title="İade ürünleri teslim alındı"
        intro="Her ürün için stoğa geri eklenip eklenmeyeceğini seçin."
        fields={(current?.lines ?? []).map((l) => ({
          name: `line_${l.line_id}`,
          label: `${l.quantity} × ${l.title}`,
          options: RESTOCK_OPTIONS,
        }))}
        defaults={Object.fromEntries(
          (current?.lines ?? []).map((l) => [`line_${l.line_id}`, "yes"]),
        )}
        schema={receiveFormSchema}
        success="İade teslim alındı."
        submit={(v) => receive.mutateAsync({ number, id: current?.id ?? 0, body: receiveBody(v) })}
        onClose={close}
      />
      <ActionDialog
        open={dialog?.step === "refund"}
        title="İade ödemesi"
        intro="Ödeme ve iade tutarı elle kaydedilir; kart iadesi yoktur."
        fields={[
          {
            name: "amount",
            label: "Tutar",
            hint: "İade edilen ürünlerin tutarı; kargo ücreti ayrıca değerlendirilir.",
          },
          {
            name: "method",
            label: "Yöntem",
            options: [
              { value: "bank_transfer", label: "Havale/EFT" },
              { value: "cash", label: "Nakit" },
            ],
          },
          { name: "iban", label: "IBAN", hint: "Havale için gerekli." },
        ]}
        defaults={{ amount: "", method: "bank_transfer", iban: "" }}
        schema={refundFormSchema}
        success="İade kaydedildi."
        submit={(v) =>
          refund.mutateAsync({
            number,
            id: current?.id ?? 0,
            body: { ...v, method: v.method as "bank_transfer" | "cash" },
          })
        }
        onClose={close}
      />
    </section>
  );
}
