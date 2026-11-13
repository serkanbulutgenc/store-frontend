import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTry } from "@/lib/format";
import { facetLabels } from "../attribute-facets";
import { type BrowseSearch, toggleValue } from "../browse-search";
import type { Facets } from "../queries";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 font-medium">{title}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  );
}

function Check({
  label,
  checked,
  onChange,
  hint,
  swatch,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  hint?: number;
  swatch?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 accent-primary"
      />
      {swatch && (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border border-border"
          style={{ backgroundColor: swatch }}
        />
      )}
      <span>{label}</span>
      {hint !== undefined && <span className="ml-auto text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Filters for colour, size, brand, price and stock. Every change goes to the URL. */
export function FilterPanel({
  facets,
  search,
  onChange,
}: {
  facets: Facets;
  search: BrowseSearch;
  onChange: (patch: Partial<BrowseSearch>) => void;
}) {
  const id = useId();
  const labels = facetLabels(facets.attributes);
  const [min, setMin] = useState(search.price_min?.toString() ?? "");
  const [max, setMax] = useState(search.price_max?.toString() ?? "");
  // Back/forward or "temizle" change the URL under us; follow it.
  const urlMin = search.price_min?.toString() ?? "";
  const urlMax = search.price_max?.toString() ?? "";
  const [seen, setSeen] = useState({ urlMin, urlMax });
  if (seen.urlMin !== urlMin || seen.urlMax !== urlMax) {
    setSeen({ urlMin, urlMax });
    setMin(urlMin);
    setMax(urlMax);
  }
  const hasFilters = Boolean(
    search.colour?.length ||
      search.size?.length ||
      search.brand?.length ||
      search.option?.length ||
      search.price_min !== undefined ||
      search.price_max !== undefined,
  );

  function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    const num = (v: string) => {
      const n = Number(v.trim().replace(",", "."));
      return v.trim() === "" || Number.isNaN(n) ? undefined : n;
    };
    onChange({ price_min: num(min), price_max: num(max) });
  }

  return (
    <div className="space-y-5">
      <Check
        label="Sadece stoktakiler"
        checked={search.in_stock ?? true}
        onChange={() => onChange({ in_stock: !(search.in_stock ?? true) })}
      />
      {facets.colours.length > 0 && (
        <Group title="Renk">
          {facets.colours.map((c) => (
            <Check
              key={c.id}
              label={c.name}
              swatch={c.hex_code}
              hint={c.count}
              checked={search.colour?.includes(c.id) ?? false}
              onChange={() => onChange({ colour: toggleValue(search.colour, c.id) })}
            />
          ))}
        </Group>
      )}
      {facets.sizes.length > 0 && (
        <Group title="Beden">
          {facets.sizes.map((s) => (
            <Check
              key={s.size}
              label={s.size}
              hint={s.count}
              checked={search.size?.includes(s.size) ?? false}
              onChange={() => onChange({ size: toggleValue(search.size, s.size) })}
            />
          ))}
        </Group>
      )}
      {facets.brands.length > 0 && (
        <Group title="Marka">
          {facets.brands.map((b) => (
            <Check
              key={b.id}
              label={b.name}
              hint={b.count}
              checked={search.brand?.includes(b.id) ?? false}
              onChange={() => onChange({ brand: toggleValue(search.brand, b.id) })}
            />
          ))}
        </Group>
      )}
      {facets.attributes.map((a) => (
        <Group key={a.id} title={labels.get(a.id) ?? a.name}>
          {a.options.map((o) => (
            <Check
              key={o.id}
              label={o.label}
              hint={o.count}
              checked={search.option?.includes(o.id) ?? false}
              onChange={() => onChange({ option: toggleValue(search.option, o.id) })}
            />
          ))}
        </Group>
      ))}
      <form onSubmit={applyPrice} className="space-y-2">
        <p className="font-medium">Fiyat (TL)</p>
        {facets.price.min && facets.price.max && (
          <p className="text-muted-foreground">
            {formatTry(facets.price.min)} – {formatTry(facets.price.max)}
          </p>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-min`} className="sr-only">
            En düşük fiyat
          </label>
          <Input
            id={`${id}-min`}
            inputMode="decimal"
            placeholder="En az"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <label htmlFor={`${id}-max`} className="sr-only">
            En yüksek fiyat
          </label>
          <Input
            id={`${id}-max`}
            inputMode="decimal"
            placeholder="En çok"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" variant="outline" className="w-full">
          Uygula
        </Button>
      </form>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMin("");
            setMax("");
            onChange({
              colour: undefined,
              size: undefined,
              brand: undefined,
              option: undefined,
              price_min: undefined,
              price_max: undefined,
            });
          }}
        >
          Filtreleri temizle
        </Button>
      )}
    </div>
  );
}
