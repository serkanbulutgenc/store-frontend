import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { can, type Me } from "@/lib/api/me";
import { formatTry } from "@/lib/format";
import {
  type OrderDetail,
  useCancelOrder,
  useCorrectEmail,
  useDeliverOrder,
  useEditShipping,
  useMarkPaid,
  useMarkReturned,
  useRefundOrder,
  useRequestReturn,
  useSetInvoiceDetails,
  useShipOrder,
} from "../queries";
import { ACTION_LABEL, allowedActions, type OrderAction, type PaymentStatus } from "../rules";
import {
  cancelFormSchema,
  emailFormSchema,
  invoiceFormSchema,
  payFormSchema,
  refundFormSchema,
  shipFormSchema,
  shippingFormSchema,
} from "../schemas";
import { ActionDialog } from "./action-dialog";

type Dialogs = "mark_paid" | "cancel" | "ship" | "refund" | "edit_shipping" | "email" | "invoice";
const DIRECT = {
  deliver: "Sipariş teslim edildi olarak işaretlendi.",
  request_return: "İade talebi kaydedildi.",
  mark_returned: "Sipariş iade alındı olarak işaretlendi.",
} as const;

/** Action buttons for the detail page plus the dialogs they open. */
export function OrderActions({ order, me }: { order: OrderDetail; me: Me }) {
  const [open, setOpen] = useState<Dialogs | null>(null);
  const close = () => setOpen(null);
  const n = order.number;
  const paymentStatus = order.payment_status as PaymentStatus;
  const actions = allowedActions(me, { actions: order.actions, payment_status: paymentStatus });
  const manage = can(me, "manage_orders");

  const pay = useMarkPaid();
  const cancel = useCancelOrder();
  const ship = useShipOrder();
  const refund = useRefundOrder();
  const editShipping = useEditShipping();
  const correctEmail = useCorrectEmail();
  const invoice = useSetInvoiceDetails();
  const direct = {
    deliver: useDeliverOrder(),
    request_return: useRequestReturn(),
    mark_returned: useMarkReturned(),
  };

  async function run(action: keyof typeof DIRECT) {
    try {
      await direct[action].mutateAsync({ number: n });
      toast.success(DIRECT[action]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem yapılamadı.");
    }
  }

  function onClick(a: OrderAction) {
    if (a in DIRECT) void run(a as keyof typeof DIRECT);
    else setOpen(a as Dialogs);
  }

  const addr = order.shipping_address;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={a === "cancel" ? "outline" : "default"}
            onClick={() => onClick(a)}
          >
            {ACTION_LABEL[a]}
          </Button>
        ))}
        {manage && (
          <>
            <Button size="sm" variant="outline" onClick={() => setOpen("email")}>
              E-postayı düzelt
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen("invoice")}>
              Fatura bilgileri
            </Button>
          </>
        )}
      </div>

      <ActionDialog
        open={open === "mark_paid"}
        title="Ödemeyi kaydet"
        intro={`Sipariş toplamı ${formatTry(order.total)}.`}
        fields={[{ name: "amount", label: "Tutar" }]}
        defaults={{ amount: order.total }}
        schema={payFormSchema}
        success="Ödeme kaydedildi."
        submit={(v) => pay.mutateAsync({ number: n, body: { amount: v.amount } })}
        onClose={close}
      />
      <ActionDialog
        open={open === "cancel"}
        title="Siparişi iptal et"
        intro={
          paymentStatus === "paid"
            ? "Sipariş ödenmiş; iptalden sonra iade ödemesi kaydetmeniz gerekir."
            : "Ayrılan stok serbest bırakılır."
        }
        fields={[{ name: "reason", label: "Gerekçe" }]}
        defaults={{ reason: "" }}
        schema={cancelFormSchema}
        success="Sipariş iptal edildi."
        submit={(v) => cancel.mutateAsync({ number: n, body: v })}
        onClose={close}
      />
      <ActionDialog
        open={open === "ship"}
        title="Kargola"
        fields={[
          { name: "carrier", label: "Kargo firması" },
          { name: "tracking_number", label: "Takip numarası" },
        ]}
        defaults={{ carrier: order.carrier ?? "", tracking_number: order.tracking_number ?? "" }}
        schema={shipFormSchema}
        success="Sipariş kargolandı."
        submit={(v) => ship.mutateAsync({ number: n, body: v })}
        onClose={close}
      />
      <ActionDialog
        open={open === "refund"}
        title="İade ödemesi"
        fields={[
          { name: "amount", label: "Tutar" },
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
        defaults={{ amount: order.paid_amount ?? order.total, method: "bank_transfer", iban: "" }}
        schema={refundFormSchema}
        success="İade kaydedildi."
        submit={(v) =>
          refund.mutateAsync({
            number: n,
            body: { ...v, method: v.method as "bank_transfer" | "cash" },
          })
        }
        onClose={close}
      />
      <ActionDialog
        open={open === "edit_shipping"}
        title="Teslimat adresi"
        fields={[
          { name: "phone", label: "Telefon" },
          { name: "il", label: "İl" },
          { name: "ilce", label: "İlçe" },
          { name: "mahalle", label: "Mahalle" },
          { name: "street", label: "Adres" },
          { name: "postal_code", label: "Posta kodu" },
        ]}
        defaults={{
          phone: addr?.phone ?? "",
          il: addr?.il ?? "",
          ilce: addr?.ilce ?? "",
          mahalle: addr?.mahalle ?? "",
          street: addr?.street ?? "",
          postal_code: addr?.postal_code ?? "",
        }}
        schema={shippingFormSchema}
        success="Adres güncellendi."
        submit={(v) => editShipping.mutateAsync({ number: n, body: v })}
        onClose={close}
      />
      <ActionDialog
        open={open === "email"}
        title="E-postayı düzelt"
        intro="Sipariş e-postaları yeni adrese yeniden gönderilir."
        fields={[{ name: "email", label: "E-posta" }]}
        defaults={{ email: order.email }}
        schema={emailFormSchema}
        success="E-posta güncellendi."
        submit={(v) => correctEmail.mutateAsync({ number: n, body: v })}
        onClose={close}
      />
      <ActionDialog
        open={open === "invoice"}
        title="Fatura bilgileri"
        fields={[
          { name: "buyer_tax_number", label: "Vergi / TC kimlik no" },
          { name: "company_title", label: "Şirket unvanı" },
        ]}
        defaults={{
          buyer_tax_number: order.buyer_tax_number ?? "",
          company_title: order.company_title ?? "",
        }}
        schema={invoiceFormSchema}
        success="Fatura bilgileri güncellendi."
        submit={(v) => invoice.mutateAsync({ number: n, body: v })}
        onClose={close}
      />
    </>
  );
}
