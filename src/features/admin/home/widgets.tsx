import type { ReactNode } from "react";
import type { Me } from "@/lib/api/me";
import type { HomeData } from "../returns/queries";
import { ReturnsWidget } from "./returns-widget";

type Def = {
  /** Shown in the edit list, where the Widget's own title (with a count) would be noisy. */
  label: string;
  render: (data: HomeData, me: Me | null) => ReactNode;
};

/** Widget key -> how it looks. The keys are the backend's (`services/home_layout.py`); a key the
 * backend sends that is not here is skipped, so a newer API never breaks an older page. */
export const WIDGETS: Record<string, Def> = {
  open_returns: {
    label: "Bekleyen iade talepleri",
    render: (data, me) =>
      data.open_returns ? <ReturnsWidget data={data.open_returns} me={me} /> : null,
  },
};
