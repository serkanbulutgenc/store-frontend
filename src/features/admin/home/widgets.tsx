import type { ReactNode } from "react";
import type { Me } from "@/lib/api/me";
import type { HomeData } from "../returns/queries";
import { ApprovalsWidget } from "./approvals-widget";
import { ContactRepliesWidget } from "./contact-replies-widget";
import { LowStockWidget } from "./low-stock-widget";
import { NewOrdersWidget, UnpaidTransfersWidget } from "./order-widgets";
import { ReturnsWidget } from "./returns-widget";

type Def = {
  /** Shown in the edit list, where the Widget's own title (with a count) would be noisy. */
  label: string;
  render: (data: HomeData, me: Me | null) => ReactNode;
};

/** Widget key -> how it looks. The keys are the backend's (`services/home_layout.py`); a key the
 * backend sends that is not here is skipped, so a newer API never breaks an older page. */
export const WIDGETS: Record<string, Def> = {
  approvals: {
    label: "Onay bekleyenler",
    render: (data) => (data.approvals ? <ApprovalsWidget data={data.approvals} /> : null),
  },
  contact_replies: {
    label: "Onay bekleyen yanıtlar",
    render: (data) =>
      data.contact_replies ? <ContactRepliesWidget data={data.contact_replies} /> : null,
  },
  new_orders: {
    label: "Yeni siparişler",
    render: (data) => (data.new_orders ? <NewOrdersWidget data={data.new_orders} /> : null),
  },
  unpaid_transfers_near_expiry: {
    label: "Süresi dolmak üzere olan havaleler",
    render: (data) =>
      data.unpaid_transfers_near_expiry ? (
        <UnpaidTransfersWidget data={data.unpaid_transfers_near_expiry} />
      ) : null,
  },
  open_returns: {
    label: "Bekleyen iade talepleri",
    render: (data, me) =>
      data.open_returns ? <ReturnsWidget data={data.open_returns} me={me} /> : null,
  },
  low_stock: {
    label: "Azalan stok",
    render: (data) => (data.low_stock ? <LowStockWidget data={data.low_stock} /> : null),
  },
};
