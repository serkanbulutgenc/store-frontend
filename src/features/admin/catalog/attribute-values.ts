import type { AttributeOut, AttributeValueIO } from "./attributes-queries";

/** What the editor holds per attribute while a Staff member is typing. */
export type Draft = { text: string; optionIds: number[] };
export type Drafts = Record<number, Draft>;

/** Drafts for every attribute of the class, from the values the Product already has. */
export function draftsFrom(attributes: AttributeOut[], stored: AttributeValueIO[]): Drafts {
  const byId = new Map(stored.map((v) => [v.attribute_id, v]));
  return Object.fromEntries(
    attributes.map((a) => {
      const v = byId.get(a.id);
      return [a.id, { text: v?.text ?? "", optionIds: [...(v?.option_ids ?? [])] }];
    }),
  );
}

/** The PUT body: every attribute of the class, so a cleared field is cleared on the server. */
export function toBody(attributes: AttributeOut[], drafts: Drafts): AttributeValueIO[] {
  return attributes.map((a) => {
    const d = drafts[a.id] ?? { text: "", optionIds: [] };
    return a.kind === "text"
      ? { attribute_id: a.id, text: d.text.trim(), option_ids: [] }
      : { attribute_id: a.id, text: null, option_ids: d.optionIds };
  });
}

/** Choosing an option: single-value attributes replace it, multi-value ones toggle it. */
export function chooseOption(attribute: AttributeOut, current: number[], id: number | null) {
  if (id === null) return [];
  if (!attribute.is_multiple) return [id];
  return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
}

export function isDirty(attributes: AttributeOut[], stored: AttributeValueIO[], drafts: Drafts) {
  const base = draftsFrom(attributes, stored);
  return attributes.some((a) => {
    const x = base[a.id];
    const y = drafts[a.id];
    if (!x || !y) return false;
    if (a.kind === "text") return x.text.trim() !== y.text.trim();
    return [...x.optionIds].sort().join() !== [...y.optionIds].sort().join();
  });
}
