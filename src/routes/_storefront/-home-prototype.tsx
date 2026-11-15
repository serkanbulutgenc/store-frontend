// PROTOTYPE (throwaway): three homepage layouts on the existing "/" route, switched via ?variant=A|B|C.
// Question: how should the home page present a full-width featured slider plus latest / on-sale / popular sections?
// Data: "featured" = newest (no featured flag in API), "popular" = rating_desc (no sales sort), "on sale" = old_price set.
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Price, ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { ProductImage } from "@/features/catalog/components/product-image";
import type { ProductCard as Card, CategoryNode } from "@/features/catalog/queries";
import { cn } from "@/lib/utils";

export type HomeData = {
  latest: Card[];
  popular: Card[];
  onSale: Card[];
  categories: CategoryNode[];
};

export const VARIANTS = [
  { key: "A", name: "Klasik: slider + sekmeli ızgara" },
  { key: "B", name: "Editoryal: bölünmüş slider + raylar" },
  { key: "C", name: "Bento: sinematik slider + mozaik" },
];

const pct = (p: Card) =>
  p.old_price ? Math.round((1 - Number(p.price) / Number(p.old_price)) * 100) : 0;

const imgUrl = (p: Card) => {
  const s = [...(p.image?.sizes ?? [])].sort((a, b) => b.width - a.width);
  return s[0]?.url;
};

/** Shared autoplay hook; the slide *designs* are not shared. */
function useSlider(count: number, ms = 5000) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % count), ms);
    return () => clearInterval(t);
  }, [paused, count, ms]);
  return {
    i,
    set: setI,
    next: () => setI((x) => (x + 1) % count),
    prev: () => setI((x) => (x - 1 + count) % count),
    hover: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) },
  };
}

function SectionHead({ title, to, sort }: { title: string; to?: boolean; sort?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {to && (
        <Link
          to="/ara"
          search={sort ? ({ sort } as never) : undefined}
          className="text-sm underline underline-offset-4"
        >
          Tümünü gör
        </Link>
      )}
    </div>
  );
}

/* ───────────── Variant A: classic retail ─────────────
 * Edge-to-edge text-left/image-right banner, then ONE tabbed grid (Yeni / İndirimde / Popüler), then categories. */
function VariantA({ latest, popular, onSale, categories }: HomeData) {
  const slides = latest.slice(0, 5);
  const s = useSlider(slides.length);
  const [tab, setTab] = useState<"latest" | "sale" | "popular">("latest");
  const tabs = [
    { k: "latest", label: "Yeni gelenler", items: latest },
    { k: "sale", label: "İndirimde", items: onSale },
    { k: "popular", label: "Popüler", items: popular },
  ] as const;
  const cur = tabs.find((t) => t.k === tab) ?? tabs[0];
  return (
    <main>
      <section
        aria-label="Öne çıkanlar"
        className="relative w-full overflow-hidden bg-muted"
        {...s.hover}
      >
        <div
          className="flex transition-transform duration-700"
          style={{ transform: `translateX(-${s.i * 100}%)` }}
        >
          {slides.map((p, n) => (
            <Link
              key={p.id}
              to="/urun/$slug"
              params={{ slug: p.slug }}
              className="grid min-w-full grid-cols-2 items-center"
              tabIndex={n === s.i ? 0 : -1}
            >
              <div className="px-6 py-10 md:px-16">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Yeni sezon
                </p>
                <h1 className="mt-2 line-clamp-3 text-2xl font-bold md:text-5xl">{p.title}</h1>
                <div className="mt-4 text-lg">
                  <Price price={p.price} oldPrice={p.old_price} />
                </div>
                <span className="mt-6 inline-block rounded-md bg-foreground px-5 py-2.5 text-background">
                  İncele
                </span>
              </div>
              <div className="h-full max-h-[28rem] overflow-hidden">
                <ProductImage
                  image={p.image}
                  sizes="50vw"
                  eager={n === 0}
                  className="h-full max-h-[28rem] object-cover object-top"
                />
              </div>
            </Link>
          ))}
        </div>
        <Arrows prev={s.prev} next={s.next} />
        <Dots n={slides.length} i={s.i} set={s.set} />
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section>
          <div role="tablist" className="mb-6 flex gap-6 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.k}
                type="button"
                role="tab"
                aria-selected={tab === t.k}
                onClick={() => setTab(t.k)}
                className={cn(
                  "-mb-px border-b-2 pb-2 text-lg",
                  tab === t.k
                    ? "border-foreground font-semibold"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {cur.items.length ? (
            <ProductGrid products={cur.items.slice(0, 8)} />
          ) : (
            <p className="text-muted-foreground">Bu bölümde ürün yok.</p>
          )}
        </section>
        <CategoryChips categories={categories} />
      </div>
    </main>
  );
}

/* ───────────── Variant B: editorial ─────────────
 * Slider = big photo left + vertical thumbnail picker right. Sections are stacked horizontal scroll rails, each with its own heading. */
function VariantB({ latest, popular, onSale, categories }: HomeData) {
  const slides = latest.slice(0, 4);
  const s = useSlider(slides.length, 6000);
  const cur = slides[s.i];
  return (
    <main>
      {cur && (
        <section
          aria-label="Öne çıkanlar"
          className="grid w-full bg-foreground text-background md:grid-cols-[1fr_22rem]"
          {...s.hover}
        >
          <Link
            to="/urun/$slug"
            params={{ slug: cur.slug }}
            className="relative block h-[26rem] overflow-hidden md:h-[34rem]"
          >
            <img
              src={imgUrl(cur)}
              alt={cur.image?.alt ?? cur.title}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white md:p-10">
              <h1 className="max-w-xl text-2xl font-bold md:text-4xl">{cur.title}</h1>
              <p className="mt-1 text-lg">{Number(cur.price).toLocaleString("tr-TR")} ₺</p>
            </div>
          </Link>
          <ul className="flex gap-2 overflow-x-auto p-3 md:flex-col md:overflow-visible">
            {slides.map((p, n) => (
              <li key={p.id} className="min-w-40 md:min-w-0">
                <button
                  type="button"
                  onClick={() => s.set(n)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-2 text-left",
                    n === s.i ? "bg-background/20" : "opacity-60 hover:opacity-100",
                  )}
                >
                  <img src={imgUrl(p)} alt="" className="size-16 shrink-0 rounded object-cover" />
                  <span className="line-clamp-2 text-sm">{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <Rail title="Yeni gelenler" sort="newest" items={latest} />
        <Rail title="İndirimdekiler" items={onSale} badge />
        <Rail title="En çok beğenilenler" sort="rating_desc" items={popular} />
        <CategoryChips categories={categories} />
      </div>
    </main>
  );
}

function Rail({
  title,
  items,
  sort,
  badge,
}: {
  title: string;
  items: Card[];
  sort?: string;
  badge?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section>
      <SectionHead title={title} to sort={sort} />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {items.slice(0, 10).map((p) => (
          <div key={p.id} className="relative w-44 shrink-0 snap-start md:w-56 [&>li]:list-none">
            <ProductCard product={p} />
            {badge && pct(p) > 0 && (
              <span className="absolute left-2 top-10 rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                %{pct(p)}
              </span>
            )}
          </div>
        ))}
      </ul>
    </section>
  );
}

/* ───────────── Variant C: bento / cinematic ─────────────
 * Full-bleed blurred-photo slider with a floating price card; below, a bento mosaic:
 * big on-sale spotlight, numbered popular ranking, compact latest grid. */
function VariantC({ latest, popular, onSale, categories }: HomeData) {
  const slides = latest.slice(0, 5);
  const s = useSlider(slides.length, 5500);
  const spot = onSale[0];
  return (
    <main>
      <section
        aria-label="Öne çıkanlar"
        className="relative h-[30rem] w-full overflow-hidden bg-black text-white"
        {...s.hover}
      >
        {slides.map((p, n) => (
          <div
            key={p.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              n === s.i ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <img
              src={imgUrl(p)}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl"
            />
            <div className="relative mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-6">
              <img
                src={imgUrl(p)}
                alt={p.image?.alt ?? p.title}
                className="h-[24rem] rounded-lg object-cover shadow-2xl"
              />
              <div className="flex-1 text-right md:text-left">
                <h1 className="line-clamp-3 text-3xl font-black md:text-6xl">{p.title}</h1>
                <Link
                  to="/urun/$slug"
                  params={{ slug: p.slug }}
                  className="mt-6 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 font-semibold text-black"
                >
                  {Number(p.price).toLocaleString("tr-TR")} ₺ <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        <Arrows prev={s.prev} next={s.next} />
        <Dots n={slides.length} i={s.i} set={s.set} />
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {spot && (
            <Link
              to="/urun/$slug"
              params={{ slug: spot.slug }}
              className="relative overflow-hidden rounded-xl lg:col-span-2 lg:row-span-1"
            >
              <img
                src={imgUrl(spot)}
                alt={spot.image?.alt ?? spot.title}
                className="h-96 w-full object-cover"
              />
              <div className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
                %{pct(spot)} İNDİRİM
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-5 text-white">
                <p className="text-xs uppercase tracking-widest">Günün fırsatı</p>
                <p className="text-xl font-semibold">{spot.title}</p>
              </div>
            </Link>
          )}
          <aside className="rounded-xl border border-border p-5">
            <h2 className="mb-3 text-lg font-semibold">Popüler</h2>
            <ol className="space-y-3">
              {popular.slice(0, 5).map((p, n) => (
                <li key={p.id}>
                  <Link
                    to="/urun/$slug"
                    params={{ slug: p.slug }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-6 text-2xl font-black text-muted-foreground">{n + 1}</span>
                    <img src={imgUrl(p)} alt="" className="size-12 rounded object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm">{p.title}</span>
                      <Price price={p.price} oldPrice={null} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>
        <section>
          <SectionHead title="Yeni gelenler" to sort="newest" />
          <ul className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {latest.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to="/urun/$slug" params={{ slug: p.slug }} title={p.title}>
                  <img
                    src={imgUrl(p)}
                    alt={p.title}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {onSale.length > 1 && (
          <section>
            <SectionHead title="Diğer indirimler" />
            <ProductGrid products={onSale.slice(1, 5)} />
          </section>
        )}
        <CategoryChips categories={categories} />
      </div>
    </main>
  );
}

/* shared bits (small on purpose) */
function Arrows({ prev, next }: { prev: () => void; next: () => void }) {
  const b =
    "absolute top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70";
  return (
    <>
      <button type="button" aria-label="Önceki slayt" onClick={prev} className={cn(b, "left-3")}>
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" aria-label="Sonraki slayt" onClick={next} className={cn(b, "right-3")}>
        <ChevronRight className="size-5" />
      </button>
    </>
  );
}
function Dots({ n, i, set }: { n: number; i: number; set: (x: number) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
      {Array.from({ length: n }, (_, k) => (
        <button
          key={k}
          type="button"
          aria-label={`Slayt ${k + 1}`}
          onClick={() => set(k)}
          className={cn(
            "h-2 rounded-full bg-white/70 transition-all",
            k === i ? "w-6 bg-white" : "w-2",
          )}
        />
      ))}
    </div>
  );
}
function CategoryChips({ categories }: { categories: CategoryNode[] }) {
  if (!categories.length) return null;
  return (
    <section aria-labelledby="cats">
      <h2 id="cats" className="mb-3 text-xl font-semibold">
        Kategoriler
      </h2>
      <ul className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              to="/kategori/$slug"
              params={{ slug: c.slug }}
              className="block rounded-full border border-border px-4 py-2 hover:bg-accent"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomePrototype({ variant, data }: { variant: string; data: HomeData }) {
  return (
    <>
      {variant === "B" ? (
        <VariantB {...data} />
      ) : variant === "C" ? (
        <VariantC {...data} />
      ) : (
        <VariantA {...data} />
      )}
    </>
  );
}
