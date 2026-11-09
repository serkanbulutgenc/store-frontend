import type * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-md border border-border bg-card px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-red-600 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
