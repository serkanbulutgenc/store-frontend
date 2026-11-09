import type * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom border-collapse text-left", className)}
        {...props}
      />
    </div>
  );
}
export const TableHeader = (p: React.ComponentProps<"thead">) => (
  <thead className="border-b border-border" {...p} />
);
export const TableBody = (p: React.ComponentProps<"tbody">) => <tbody {...p} />;
export const TableRow = ({ className, ...p }: React.ComponentProps<"tr">) => (
  <tr
    className={cn("h-(--row-height) border-b border-border hover:bg-muted/60", className)}
    {...p}
  />
);
export const TableHead = ({ className, ...p }: React.ComponentProps<"th">) => (
  <th className={cn("px-3 font-medium text-muted-foreground", className)} {...p} />
);
export const TableCell = ({ className, ...p }: React.ComponentProps<"td">) => (
  <td className={cn("px-3", className)} {...p} />
);
