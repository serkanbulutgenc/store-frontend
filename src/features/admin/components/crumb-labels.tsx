import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Ctx = { labels: Record<string, string>; set: (segment: string, label: string) => void };
const CrumbContext = createContext<Ctx | null>(null);

/** Lets a detail screen name its breadcrumb (a product title instead of its id). */
export function CrumbLabelsProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const value = useMemo<Ctx>(
    () => ({
      labels,
      set: (segment, label) =>
        setLabels((prev) => (prev[segment] === label ? prev : { ...prev, [segment]: label })),
    }),
    [labels],
  );
  return <CrumbContext.Provider value={value}>{children}</CrumbContext.Provider>;
}

export function useCrumbLabels(): Record<string, string> {
  return useContext(CrumbContext)?.labels ?? {};
}

/** Call from a screen: `useCrumbLabel(String(productId), product.title)`. */
export function useCrumbLabel(segment: string, label: string | undefined) {
  const ctx = useContext(CrumbContext);
  const set = ctx?.set;
  useEffect(() => {
    if (set && label) set(segment, label);
  }, [set, segment, label]);
}
