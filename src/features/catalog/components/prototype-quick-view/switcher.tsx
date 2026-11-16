// PROTOTYPE: throwaway floating bar to flip between quick-view variants.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { setVariant, useVariant, VARIANTS } from "./variant-store";

export function PrototypeSwitcher() {
  const current = useVariant();
  const idx = VARIANTS.findIndex((v) => v.key === current);
  const go = (d: number) =>
    setVariant(VARIANTS[(idx + d + VARIANTS.length) % VARIANTS.length]?.key ?? "A");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-3 py-2 text-sm text-white shadow-xl">
      <button type="button" aria-label="Önceki varyant" onClick={() => go(-1)}>
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-52 text-center">
        {current} ({VARIANTS[idx]?.name})
      </span>
      <button type="button" aria-label="Sonraki varyant" onClick={() => go(1)}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
