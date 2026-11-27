import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useState } from "react";
import type { Announcement } from "../queries";
import { useRotation } from "../rotation";
import { BannerLink } from "./picture-banner";

const DELAY = 7000;

/** A text-only strip above the header. Several messages rotate slowly, one at a time. An empty
 * slot renders nothing. */
export function AnnouncementBar({ messages }: { messages: Announcement[] }) {
  const [hold, setHold] = useState(false);
  const { index, go, paused, setPaused, reduced } = useRotation(messages.length, DELAY, hold);
  const current = messages[index];
  if (!current) return null;
  const many = messages.length > 1;
  const btn =
    "grid size-7 place-items-center rounded hover:bg-foreground/10 focus-visible:outline-2";
  return (
    <section
      aria-label="Duyurular"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      className="flex items-center justify-center gap-2 bg-rose px-4 py-1.5 text-center text-sm text-rose-foreground"
    >
      {many && (
        <button type="button" onClick={() => go(-1)} aria-label="Önceki duyuru" className={btn}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      )}
      <p aria-live={many && !paused && !reduced ? "off" : "polite"} className="min-w-0">
        <BannerLink link={current.link} className="underline-offset-4 hover:underline">
          {current.message}
        </BannerLink>
      </p>
      {many && (
        <>
          <button type="button" onClick={() => go(1)} aria-label="Sonraki duyuru" className={btn}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          {!reduced && (
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Duyuruları oynat" : "Duyuruları duraklat"}
              className={btn}
            >
              {paused ? (
                <Play className="size-4" aria-hidden="true" />
              ) : (
                <Pause className="size-4" aria-hidden="true" />
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
}
