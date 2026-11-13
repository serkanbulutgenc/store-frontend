import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { favoritesQuery } from "../queries";

export function FavoritesPage() {
  const { data, isPending, isError } = useQuery(favoritesQuery);
  return (
    <section aria-labelledby="favorites" className="space-y-4">
      <h1 id="favorites" className="text-2xl font-semibold">
        Favorilerim
      </h1>
      {isPending && <div className="h-24 animate-pulse rounded-md bg-muted" aria-busy="true" />}
      {isError && <p role="alert">Favorileriniz yüklenemedi. Lütfen sayfayı yenileyin.</p>}
      {data && data.length === 0 && (
        <p>Henüz favori ürününüz yok. Beğendiğiniz ürünlerdeki kalbe dokunarak buraya ekleyin.</p>
      )}
      {data && data.length > 0 && <ProductGrid products={data} dimSoldOut />}
    </section>
  );
}
