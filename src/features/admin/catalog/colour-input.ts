const HEX = /^#[0-9a-fA-F]{6}$/;

/** What the native picker shows: the typed value when it is a full `#RRGGBB`, else the last
 * valid one. `<input type="color">` only accepts lowercase `#rrggbb`. */
export function pickerValue(typed: string, lastValid: string): string {
  return HEX.test(typed) ? typed.toLowerCase() : lastValid;
}
