import { useBlocker } from "@tanstack/react-router";

export const LEAVE_MESSAGE = "Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istiyor musunuz?";

/**
 * Form convention: call with `form.state.isDirty` (and not while submitting). Blocks
 * in-app navigation with a confirm and the browser tab close with the native prompt.
 */
export function useDirtyGuard(isDirty: boolean) {
  useBlocker({
    shouldBlockFn: () => isDirty && !window.confirm(LEAVE_MESSAGE),
    enableBeforeUnload: () => isDirty,
  });
}
