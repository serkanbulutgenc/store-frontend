import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";

/** Shared `pendingComponent`: a skeleton block, no spinner flash. */
export function PendingState() {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="Yükleniyor">
      <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-32 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

/** Shared `errorComponent`. Shows the API's Turkish message when there is one. */
export function ErrorState({ error, reset }: ErrorComponentProps) {
  const message = error instanceof ApiError ? error.message : "Beklenmeyen bir hata oluştu.";
  return (
    <div className="space-y-2 p-4" role="alert">
      <h2 className="text-lg font-semibold">Bir şeyler ters gitti</h2>
      <p className="text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={reset}>
        Tekrar dene
      </Button>
    </div>
  );
}

/** Shared `notFoundComponent`. */
export function NotFoundState({ home = "/" }: { home?: "/" | "/admin" }) {
  return (
    <div className="space-y-2 p-4">
      <h2 className="text-lg font-semibold">Sayfa bulunamadı</h2>
      <Link to={home} className="underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
