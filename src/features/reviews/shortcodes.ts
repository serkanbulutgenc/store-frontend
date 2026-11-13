const SHORTCODES: Record<string, string> = {
  smile: "😄",
  grin: "😁",
  joy: "😂",
  wink: "😉",
  blush: "😊",
  heart_eyes: "😍",
  sunglasses: "😎",
  thinking: "🤔",
  cry: "😢",
  heart: "❤️",
  thumbsup: "👍",
  thumbsdown: "👎",
  clap: "👏",
  ok_hand: "👌",
  pray: "🙏",
  fire: "🔥",
  star: "⭐",
  sparkles: "✨",
  tada: "🎉",
  "100": "💯",
};

/** Turns the small known set of `:shortcode:` names into Unicode emoji; unknown ones stay as typed. */
export function convertShortcodes(text: string): string {
  return text.replace(
    /(?<![\p{L}\p{N}]):([a-z0-9_]+):(?![\p{L}\p{N}])/gu,
    (whole, name: string) => SHORTCODES[name] ?? whole,
  );
}
