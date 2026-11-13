import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { MarkdownText } from "@/components/markdown-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StarsInline } from "@/features/reviews/components/stars";
import { reviewStatusLabel } from "@/features/reviews/format";
import { formatDate } from "@/lib/format";
import {
  type AdminReview,
  adminReviewsQuery,
  type ReviewsSearch,
  useApproveReview,
  useDeleteAdminReview,
  useRejectReview,
} from "./queries";

const STATUSES = ["pending", "published", "rejected"] as const;

function ReviewCard({ review, canManage }: { review: AdminReview; canManage: boolean }) {
  const approve = useApproveReview();
  const reject = useRejectReview();
  const remove = useDeleteAdminReview();
  const busy = approve.isPending || reject.isPending || remove.isPending;

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem yapılamadı.");
    }
  }

  return (
    <li className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong>{review.product_title}</strong>
        <StarsInline stars={review.stars} />
        <Badge tone={review.status === "pending" ? "warn" : "neutral"}>
          {reviewStatusLabel(review.status)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {review.author} ({review.author_email}) · {formatDate(review.updated_at)}
          {review.moderated_by && ` · ${review.moderated_by}`}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Görünüm</h3>
          <MarkdownText source={review.body} className="text-sm" />
        </div>
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Kaynak</h3>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-xs">
            {review.body}
          </pre>
        </div>
      </div>
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {review.status !== "published" && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => run(() => approve.mutateAsync(review.id), "Yorum yayınlandı.")}
            >
              Onayla
            </Button>
          )}
          {review.status !== "rejected" && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => run(() => reject.mutateAsync(review.id), "Yorum reddedildi.")}
            >
              Reddet
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Bu değerlendirme kalıcı olarak silinsin mi?")) return;
              void run(() => remove.mutateAsync(review.id), "Değerlendirme silindi.");
            }}
          >
            Sil
          </Button>
        </div>
      )}
    </li>
  );
}

export function ReviewsScreen({
  search,
  onSearchChange,
  canManage,
}: {
  search: ReviewsSearch;
  onSearchChange: (patch: Partial<ReviewsSearch>) => void;
  canManage: boolean;
}) {
  const { data } = useSuspenseQuery(adminReviewsQuery(search));
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  // Acting on the last item of a later page leaves that page empty: step back.
  useEffect(() => {
    if (data.items.length === 0 && search.page > pages) onSearchChange({ page: pages });
  }, [data.items.length, search.page, pages, onSearchChange]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Yorumlar</h1>
        <Select
          aria-label="Duruma göre filtrele"
          className="w-44"
          value={search.status}
          onChange={(e) =>
            onSearchChange({ status: e.target.value as ReviewsSearch["status"], page: 1 })
          }
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {reviewStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Yalnızca metin içeren değerlendirmeler burada incelenir; yıldızlar hemen yayınlanır.
      </p>
      {data.items.length === 0 && <p>Bu durumda yorum yok.</p>}
      <ul className="space-y-3">
        {data.items.map((r) => (
          <ReviewCard key={r.id} review={r} canManage={canManage} />
        ))}
      </ul>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={search.page <= 1}
            onClick={() => onSearchChange({ page: search.page - 1 })}
          >
            Önceki
          </Button>
          <span className="text-sm">
            {search.page} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={search.page >= pages}
            onClick={() => onSearchChange({ page: search.page + 1 })}
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
