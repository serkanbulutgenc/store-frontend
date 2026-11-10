import type { ReactNode } from "react";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="space-y-4 rounded-md border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

/** Result of a step that continues by email or elsewhere. */
export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="space-y-1 rounded-md bg-muted p-3">
      <p className="font-medium">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
