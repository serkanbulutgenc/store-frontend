import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAverage } from "../format";

/** Read-only stars with the average and count as text; nothing when there are no reviews. */
export function RatingSummary({
  average,
  count,
  className,
}: {
  average: number | null;
  count: number;
  className?: string;
}) {
  if (average === null || count === 0) return null;
  return (
    <p className={cn("flex items-center gap-1 text-sm", className)}>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              "size-4",
              n <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-border",
            )}
          />
        ))}
      </span>
      <span className="sr-only">5 üzerinden {formatAverage(average)}, </span>
      <span aria-hidden="true">{formatAverage(average)}</span>
      <span className="text-muted-foreground">({count})</span>
      <span className="sr-only"> değerlendirme</span>
    </p>
  );
}

export function StarsInline({ stars }: { stars: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`5 üzerinden ${stars} yıldız`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn("size-4", n <= stars ? "fill-amber-400 text-amber-400" : "text-border")}
        />
      ))}
    </span>
  );
}
