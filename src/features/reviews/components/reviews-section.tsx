import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownText } from "@/components/markdown-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { accountQuery } from "@/features/account/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BODY_MAX, reviewStatusLabel } from "../format";
import {
  type MyReviewState,
  myReviewQuery,
  reviewsQuery,
  useDeleteReview,
  useSaveReview,
} from "../queries";
import { convertShortcodes } from "../shortcodes";
import { RatingSummary, StarsInline } from "./stars";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <fieldset className="flex gap-1 border-0 p-0">
      <legend className="sr-only">Puanınız</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className="cursor-pointer rounded-md p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
        >
          <input
            type="radio"
            name="review-stars"
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="sr-only"
          />
          <span className="sr-only">{n} yıldız</span>
          <Star
            aria-hidden="true"
            className={cn("size-7", n <= value ? "fill-amber-400 text-amber-400" : "text-border")}
          />
        </label>
      ))}
    </fieldset>
  );
}

function ReviewForm({
  slug,
  productId,
  mine,
}: {
  slug: string;
  productId: number;
  mine: MyReviewState["review"];
}) {
  const [stars, setStars] = useState(mine?.stars ?? 0);
  const [body, setBody] = useState(mine?.body ?? "");
  const save = useSaveReview(slug, productId);
  const remove = useDeleteReview(slug, productId);
  const busy = save.isPending || remove.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) {
      toast.error("Lütfen bir puan seçin.");
      return;
    }
    const text = convertShortcodes(body).trim();
    save.mutate(
      { stars, body: text },
      {
        onSuccess: () => {
          setBody(text);
          toast.success(
            text ? "Yorumunuz alındı; onaylandıktan sonra yayınlanacak." : "Puanınız kaydedildi.",
          );
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border border-border p-4">
      <h3 className="font-medium">{mine ? "Değerlendirmeniz" : "Ürünü değerlendirin"}</h3>
      {mine && (
        <p className="text-sm text-muted-foreground" role="status">
          Durum: {reviewStatusLabel(mine.status)}
        </p>
      )}
      <StarPicker value={stars} onChange={setStars} />
      <div>
        <label htmlFor="review-body" className="mb-1 block text-sm font-medium">
          Yorumunuz (isteğe bağlı)
        </label>
        <Textarea
          id="review-body"
          value={body}
          maxLength={BODY_MAX}
          onChange={(e) => setBody(e.target.value)}
          aria-describedby="review-help"
          rows={4}
        />
        <p id="review-help" className="mt-1 text-xs text-muted-foreground">
          **kalın**, *italik*, ~~üstü çizili~~ ve “- ” ile liste kullanabilirsiniz; :smile: gibi
          kodlar emojiye dönüşür. Yazdığınız yorum onaylandıktan sonra yayınlanır. {body.length}/
          {BODY_MAX}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {mine ? "Güncelle" : "Gönder"}
        </Button>
        {mine && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Değerlendirmenizi silmek istiyor musunuz?")) return;
              remove.mutate(undefined, {
                onSuccess: () => {
                  setStars(0);
                  setBody("");
                  toast.success("Değerlendirmeniz silindi.");
                },
                onError: (err) => toast.error(err.message),
              });
            }}
          >
            Sil
          </Button>
        )}
      </div>
    </form>
  );
}

function WriteReview({ slug, productId }: { slug: string; productId: number }) {
  const router = useRouter();
  const { data: account, isPending } = useQuery(accountQuery);
  const { data: state, isError } = useQuery({ ...myReviewQuery(slug), enabled: Boolean(account) });
  if (isPending) return null;
  if (!account)
    return (
      <p>
        Değerlendirme yazmak için{" "}
        <Link
          to="/hesap/giris"
          search={{ redirect: router.state.location.href }}
          className="underline"
        >
          giriş yapın
        </Link>
        . Yalnızca satın alıp teslim alan müşteriler değerlendirme yapabilir.
      </p>
    );
  if (isError)
    return <p role="alert">Değerlendirme durumunuz yüklenemedi. Lütfen sayfayı yenileyin.</p>;
  if (!state) return null;
  if (!state.can_review && !state.review)
    return <p className="text-muted-foreground">{state.message}</p>;
  // `key` re-seeds the form when the saved review changes under it.
  return (
    <ReviewForm
      key={`${state.review?.id}-${state.review?.status}`}
      slug={slug}
      productId={productId}
      mine={state.review}
    />
  );
}

export function ReviewsSection({ slug, productId }: { slug: string; productId: number }) {
  const [page, setPage] = useState(1);
  const { data } = useQuery(reviewsQuery(slug, page));
  const pages = data ? Math.max(1, Math.ceil(data.count / data.page_size)) : 1;
  return (
    <section className="mt-12 max-w-3xl space-y-4" aria-labelledby="reviews">
      <h2 id="reviews" className="text-lg font-semibold">
        Değerlendirmeler
      </h2>
      {data && <RatingSummary average={data.average} count={data.count} />}
      {data && data.count === 0 && (
        <p className="text-muted-foreground">Henüz değerlendirme yok.</p>
      )}
      <ul className="space-y-4">
        {data?.items.map((r) => (
          <li key={r.id} className="border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-x-3">
              <StarsInline stars={r.stars} />
              <span className="font-medium">{r.author}</span>
              <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            {r.body && <MarkdownText source={r.body} className="mt-2" />}
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav aria-label="Değerlendirme sayfaları" className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Önceki
          </Button>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Sonraki
          </Button>
        </nav>
      )}
      <WriteReview slug={slug} productId={productId} />
    </section>
  );
}
