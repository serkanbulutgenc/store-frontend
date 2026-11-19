import type { Target } from "./form";

/** How many suggestions the dropdown shows at once. */
export const MAX_OFFERED = 8;

/** The suggestions for the typed text: matches not chosen yet, once `minChars` letters are typed. */
export function offeredTargets(
  matches: Target[],
  chosen: Target[],
  typed: string,
  minChars: number,
): Target[] {
  if (typed.trim().length < minChars) return [];
  const taken = new Set(chosen.map((t) => t.id));
  return matches.filter((m) => !taken.has(m.id)).slice(0, MAX_OFFERED);
}

export type PickerKey = "ArrowDown" | "ArrowUp" | "Enter" | "Escape";
export type PickerState = { open: boolean; active: number };

/**
 * What a key does to the dropdown: the next state, and `pick`, the index of the suggestion the
 * key chose (`null` when it chose none). `count` is how many suggestions are offered.
 */
export function pickerKey(
  state: PickerState,
  key: PickerKey,
  count: number,
): PickerState & { pick: number | null } {
  if (count === 0 || key === "Escape") return { open: false, active: 0, pick: null };
  if (key === "Enter") {
    return state.open
      ? { open: false, active: 0, pick: state.active }
      : { open: false, active: 0, pick: null };
  }
  if (key === "ArrowDown") {
    return { open: true, active: state.open ? (state.active + 1) % count : 0, pick: null };
  }
  return {
    open: true,
    active: state.open ? (state.active - 1 + count) % count : count - 1,
    pick: null,
  };
}
