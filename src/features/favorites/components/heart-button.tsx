import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { accountQuery } from "@/features/account/queries";
import { cn } from "@/lib/utils";
import { setPendingFavorite, takePendingFavorite } from "../pending";
import { useFavoriteIds, useSetFavorite } from "../queries";

export function HeartButton({ productId, className }: { productId: number; className?: string }) {
  const { signedIn, ready, ids } = useFavoriteIds();
  const set = useSetFavorite();
  const navigate = useNavigate();
  const router = useRouter();
  // While a request is in flight the heart already shows where it is going.
  const hearted = set.isPending ? set.variables.on : ids.has(productId);

  function toggle() {
    if (!signedIn) {
      setPendingFavorite(productId);
      void navigate({ to: "/hesap/giris", search: { redirect: router.state.location.href } });
      return;
    }
    set.mutate({ productId, on: !hearted });
  }

  return (
    <button
      type="button"
      aria-pressed={hearted}
      aria-label={hearted ? "Favorilerden çıkar" : "Favorilere ekle"}
      onClick={toggle}
      disabled={!ready || set.isPending}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <Heart className={cn("size-5", hearted && "fill-primary text-primary")} aria-hidden="true" />
    </button>
  );
}

/** Applies the heart a guest tapped before signing in, once they are back and signed in. */
export function PendingFavorite() {
  const { data: account } = useQuery(accountQuery);
  const { mutate } = useSetFavorite();
  useEffect(() => {
    if (!account) return;
    const productId = takePendingFavorite();
    if (productId === null) return;
    mutate(
      { productId, on: true },
      {
        onSuccess: () => toast.success("Ürün favorilerinize eklendi."),
      },
    );
  }, [account, mutate]);
  return null;
}
