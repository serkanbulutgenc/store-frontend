import { ApiError } from "@/lib/api/errors";
import type { ItemPath } from "./tree";

export type ItemError = {
  path: ItemPath;
  /** The item field the message is about, or null when it is about the item as a whole. */
  field: string | null;
  message: string;
};
export type MenuErrors = { top: string[]; items: ItemError[] };

/** `items[0].children[2].label` is the label of the third child of the first item. */
const ITEM_KEY = /^items((?:\[\d+\]|\.children\[\d+\])+)(?:\.(\w+))?$/;

function parsePlace(key: string): { path: ItemPath; field: string | null } | null {
  const match = ITEM_KEY.exec(key);
  if (!match?.[1]) return null;
  const path = [...match[1].matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  return { path, field: match[2] ?? null };
}

/**
 * Sort a failed save into messages for the top of the screen (rules about the whole Menu,
 * or a failure that names no field) and messages for single items.
 */
export function menuErrors(error: unknown): MenuErrors {
  if (!(error instanceof ApiError)) return { top: ["Beklenmeyen bir hata oluştu."], items: [] };
  const top: string[] = [];
  const items: ItemError[] = [];
  for (const [key, messages] of Object.entries(error.fields)) {
    const place = parsePlace(key);
    if (!place) top.push(...messages);
    else for (const message of messages) items.push({ ...place, message });
  }
  // The envelope's own message is only worth showing when no field says what is wrong.
  if (top.length === 0 && items.length === 0) top.push(error.message);
  return { top, items };
}
