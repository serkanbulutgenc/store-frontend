import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { productClassesQuery } from "../catalog/queries";
import {
  type ProvinceOut,
  type RateOut,
  shippingQuery,
  useMoveProvince,
  useRenameZone,
  useSetClassDesi,
  useUpdateRate,
  type ZoneOut,
} from "./queries";
import {
  desiError,
  findProvince,
  PRICE_FIELDS,
  PRICE_LABELS,
  type RateDraft,
  rateDirty,
  rateErrors,
  toRatePatch,
} from "./rules";

const toDraft = (r: RateOut): RateDraft => ({
  band_0_2: r.band_0_2,
  band_3_5: r.band_3_5,
  band_6_10: r.band_6_10,
  per_extra_desi: r.per_extra_desi,
});

const fail = (e: unknown) =>
  toast.error(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.");

function RateRowEditor({ rate, carrier }: { rate: RateOut; carrier: string }) {
  const update = useUpdateRate();
  const saved = toDraft(rate);
  const [draft, setDraft] = useState<RateDraft>(saved);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const errors = { ...apiErrors, ...rateErrors(draft) };
  const dirty = rateDirty(saved, draft);
  const invalid = Object.keys(rateErrors(draft)).length > 0;

  async function save() {
    try {
      await update.mutateAsync({ id: rate.id, body: toRatePatch(saved, draft) });
      setApiErrors({});
      toast.success(`${carrier} fiyatları kaydedildi.`);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length > 0) {
        setApiErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0] ?? ""])));
      } else fail(e);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{carrier}</TableCell>
      {PRICE_FIELDS.map((f) => {
        const error = errors[f];
        return (
          <TableCell key={f} className="align-top">
            <Input
              inputMode="decimal"
              aria-label={`${carrier} ${PRICE_LABELS[f]}`}
              aria-invalid={Boolean(error)}
              value={draft[f]}
              onChange={(e) => {
                setApiErrors({});
                setDraft({ ...draft, [f]: e.target.value });
              }}
            />
            {error && <span className="block text-red-700">{error}</span>}
          </TableCell>
        );
      })}
      <TableCell className="align-top">
        <Button size="sm" disabled={!dirty || invalid || update.isPending} onClick={save}>
          Kaydet
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ZoneName({ zone }: { zone: ZoneOut }) {
  const rename = useRenameZone();
  const [name, setName] = useState(zone.name);
  const dirty = name.trim() !== zone.name;
  return (
    <div className="flex items-center gap-2">
      <Input
        className="max-w-48"
        aria-label={`Bölge ${zone.number} adı`}
        placeholder="Bölge adı (isteğe bağlı)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!dirty || rename.isPending}
        onClick={() =>
          rename.mutate(
            { id: zone.id, name },
            { onSuccess: () => toast.success("Ad kaydedildi."), onError: fail },
          )
        }
      >
        Adı kaydet
      </Button>
    </div>
  );
}

/** The zone's provinces as chips, plus a type-ahead to move another province into this zone. */
function ZoneProvinces({
  zone,
  provinces,
  zones,
}: {
  zone: ZoneOut;
  provinces: ProvinceOut[];
  zones: ZoneOut[];
}) {
  const move = useMoveProvince();
  const [text, setText] = useState("");
  const listId = useId();
  const inZone = provinces.filter((p) => p.zone_id === zone.id);
  const others = provinces.filter((p) => p.zone_id !== zone.id);
  const zoneOf = (id: number) => zones.find((z) => z.id === id);

  function pick(value: string) {
    setText(value);
    const province = findProvince(others, value);
    if (!province) return;
    move.mutate(
      { id: province.id, zone_id: zone.id },
      {
        onSuccess: () => {
          setText("");
          toast.success(`${province.name} Bölge ${zone.number} bölgesine taşındı.`);
        },
        onError: fail,
      },
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-muted-foreground" htmlFor={`add-${zone.id}`}>
        İl ekle (başka bölgedeki bir il buraya taşınır)
      </label>
      <Input
        id={`add-${zone.id}`}
        className="max-w-xs"
        list={listId}
        placeholder="İl adı yazın…"
        autoComplete="off"
        disabled={move.isPending}
        value={text}
        onChange={(e) => pick(e.target.value)}
      />
      <datalist id={listId}>
        {others.map((p) => {
          const z = zoneOf(p.zone_id);
          return (
            <option key={p.id} value={p.name}>
              {z ? `Bölge ${z.number}` : ""}
            </option>
          );
        })}
      </datalist>
      {inZone.length === 0 ? (
        <p className="text-muted-foreground">Bu bölgede il yok.</p>
      ) : (
        <ul aria-label={`Bölge ${zone.number} illeri`} className="flex flex-wrap gap-1.5">
          {inZone.map((p) => (
            <li key={p.id} className="rounded-md border border-border bg-card px-2 py-0.5">
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClassDesiRow({ id, name, desi }: { id: number; name: string; desi: number }) {
  const set = useSetClassDesi();
  const [value, setValue] = useState(String(desi));
  const error = desiError(value);
  return (
    <TableRow>
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell className="align-top">
        <Input
          className="max-w-24"
          inputMode="numeric"
          aria-label={`${name} varsayılan desi`}
          aria-invalid={Boolean(error)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && <span className="block text-red-700">{error}</span>}
      </TableCell>
      <TableCell className="align-top">
        <Button
          size="sm"
          disabled={Boolean(error) || value.trim() === String(desi) || set.isPending}
          onClick={() =>
            set.mutate(
              { id, default_desi: Number(value) },
              { onSuccess: () => toast.success(`${name} desi kaydedildi.`), onError: fail },
            )
          }
        >
          Kaydet
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ShippingScreen() {
  const { data } = useSuspenseQuery(shippingQuery);
  const classes = useQuery(productClassesQuery);
  const carriers = new Map(data.carriers.map((c) => [c.id, c.name]));

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Kargo fiyatları</h1>
        <p className="text-muted-foreground">
          Ödeme sayfasında en ucuz kargo firmasının fiyatı gösterilir. Tutarlar KDV dahil TRY. Yeni
          fiyatlar yalnızca yeni siparişlerde geçerlidir.
        </p>
      </div>

      {data.zones.map((zone, i) => {
        const count = data.provinces.filter((p) => p.zone_id === zone.id).length;
        return (
          <Collapsible
            key={zone.id}
            defaultOpen={i === 0}
            className="rounded-lg border border-border bg-card"
          >
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium">
              <span>
                Bölge {zone.number}
                {zone.name ? ` · ${zone.name}` : ""}
                <span className="ml-2 font-normal text-muted-foreground">{count} il</span>
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 transition-transform group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 border-t border-border p-3">
              <ZoneName key={zone.name} zone={zone} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma</TableHead>
                    {PRICE_FIELDS.map((f) => (
                      <TableHead key={f}>{PRICE_LABELS[f]}</TableHead>
                    ))}
                    <TableHead>
                      <span className="sr-only">İşlem</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rates
                    .filter((r) => r.zone_id === zone.id)
                    .map((r) => (
                      // Keyed by the saved prices so a refetch resets the row's draft.
                      <RateRowEditor
                        key={`${r.id}:${PRICE_FIELDS.map((f) => r[f]).join("|")}`}
                        rate={r}
                        carrier={carriers.get(r.carrier_id) ?? "?"}
                      />
                    ))}
                </TableBody>
              </Table>
              <ZoneProvinces zone={zone} provinces={data.provinces} zones={data.zones} />
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      <section aria-labelledby="class-desi" className="space-y-2">
        <h2 id="class-desi" className="font-medium">
          Ürün sınıfı varsayılan desi
        </h2>
        <p className="text-muted-foreground">
          Bir ürünün kendi desisi yoksa sınıfın değeri kullanılır. Sipariş desisi, ürün desisi ×
          adet toplamıdır.
        </p>
        <Table className="max-w-md">
          <TableHeader>
            <TableRow>
              <TableHead>Sınıf</TableHead>
              <TableHead>Desi</TableHead>
              <TableHead>
                <span className="sr-only">İşlem</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.data?.map((c) => (
              <ClassDesiRow
                key={`${c.id}:${c.default_desi}`}
                id={c.id}
                name={c.name}
                desi={c.default_desi}
              />
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
