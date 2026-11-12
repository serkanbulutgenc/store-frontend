import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

function ProvinceRow({ province, zones }: { province: ProvinceOut; zones: ZoneOut[] }) {
  const move = useMoveProvince();
  return (
    <TableRow>
      <TableCell>{province.name}</TableCell>
      <TableCell>
        <Select
          aria-label={`${province.name} bölgesi`}
          value={province.zone_id}
          disabled={move.isPending}
          onChange={(e) =>
            move.mutate(
              { id: province.id, zone_id: Number(e.target.value) },
              { onSuccess: () => toast.success(`${province.name} taşındı.`), onError: fail },
            )
          }
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              Bölge {z.number}
              {z.name ? ` · ${z.name}` : ""}
            </option>
          ))}
        </Select>
      </TableCell>
    </TableRow>
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Kargo fiyatları</h1>
        <p className="text-muted-foreground">
          Ödeme sayfasında en ucuz kargo firmasının fiyatı gösterilir. Tutarlar KDV dahil TRY. Yeni
          fiyatlar yalnızca yeni siparişlerde geçerlidir.
        </p>
      </div>

      {data.zones.map((zone) => (
        <section key={zone.id} aria-labelledby={`zone-${zone.id}`} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id={`zone-${zone.id}`} className="font-medium">
              Bölge {zone.number}
            </h2>
            <ZoneName key={zone.name} zone={zone} />
          </div>
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
        </section>
      ))}

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

      <section aria-labelledby="provinces" className="space-y-2">
        <h2 id="provinces" className="font-medium">
          İllerin bölgeleri
        </h2>
        <Table className="max-w-md">
          <TableHeader>
            <TableRow>
              <TableHead>İl</TableHead>
              <TableHead>Bölge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.provinces.map((p) => (
              <ProvinceRow key={`${p.id}:${p.zone_id}`} province={p} zones={data.zones} />
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
