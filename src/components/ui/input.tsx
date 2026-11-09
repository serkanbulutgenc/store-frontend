import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-8 w-full rounded-md border border-border bg-card px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-red-600",
        className,
      )}
      {...props}
    />
  );
}
