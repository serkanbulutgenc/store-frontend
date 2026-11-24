import {
  ChartColumn,
  ClipboardCheck,
  Clock,
  type LucideIcon,
  Mail,
  PackageMinus,
  ShoppingCart,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Me } from "@/lib/api/me";
import type { HomeData } from "../returns/queries";
import { ApprovalsWidget } from "./approvals-widget";
import { ContactRepliesWidget } from "./contact-replies-widget";
import { LowStockWidget } from "./low-stock-widget";
import { NewOrdersWidget, UnpaidTransfersWidget } from "./order-widgets";
import { ReportSummaryWidget } from "./report-summary-widget";
import { ReturnsWidget } from "./returns-widget";

type Def = {
  /** Shown in the edit list, where the Widget's own title (with a count) would be noisy. */
  label: string;
  /** The icon in the card's header: the sidebar's own icon for the same area where there is one. */
  icon: LucideIcon;
  render: (data: HomeData, me: Me | null) => ReactNode;
};

/** Widget key -> how it looks. The keys are the backend's (`services/home_layout.py`); a key the
 * backend sends that is not here is skipped, so a newer API never breaks an older page. */
export const WIDGETS: Record<string, Def> = {
  approvals: {
    label: "Onay bekleyenler",
    icon: ClipboardCheck,
    render: (data) => (data.approvals ? <ApprovalsWidget data={data.approvals} /> : null),
  },
  contact_replies: {
    label: "Onay bekleyen yanıtlar",
    icon: Mail,
    render: (data) =>
      data.contact_replies ? <ContactRepliesWidget data={data.contact_replies} /> : null,
  },
  report_summary: {
    label: "Satış özeti",
    icon: ChartColumn,
    render: (data) =>
      data.report_summary ? <ReportSummaryWidget data={data.report_summary} /> : null,
  },
  new_orders: {
    label: "Yeni siparişler",
    icon: ShoppingCart,
    render: (data) => (data.new_orders ? <NewOrdersWidget data={data.new_orders} /> : null),
  },
  unpaid_transfers_near_expiry: {
    label: "Süresi dolmak üzere olan havaleler",
    icon: Clock,
    render: (data) =>
      data.unpaid_transfers_near_expiry ? (
        <UnpaidTransfersWidget data={data.unpaid_transfers_near_expiry} />
      ) : null,
  },
  open_returns: {
    label: "Bekleyen iade talepleri",
    icon: Undo2,
    render: (data, me) =>
      data.open_returns ? <ReturnsWidget data={data.open_returns} me={me} /> : null,
  },
  low_stock: {
    label: "Azalan stok",
    icon: PackageMinus,
    render: (data) => (data.low_stock ? <LowStockWidget data={data.low_stock} /> : null),
  },
};
