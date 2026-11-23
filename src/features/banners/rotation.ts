import { useCallback, useEffect, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Index of the shown item, advancing every `delay` ms. It holds still while `hold` is true
 * (hover or focus), after the viewer pauses it, and always under reduced motion: the viewer
 * then moves with the controls only.
 */
export function useRotation(count: number, delay: number, hold: boolean) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(prefersReducedMotion()), []);
  useEffect(() => {
    if (count < 2 || hold || paused || reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), delay);
    return () => clearInterval(id);
  }, [count, delay, hold, paused, reduced]);
  const go = useCallback((by: number) => setIndex((i) => (i + by + count) % count), [count]);
  return { index: count ? index % count : 0, go, paused, setPaused, reduced };
}
