import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { collectionKeys, collectionsQuery } from "./queries";
import { COLLECTION_STATUSES, collectionStatusLabel, collectionStatusTone } from "./rules";
import type { CollectionSearch } from "./search";

const HEADERS = ["Ad", "Durum", "Ürün", "Yayın tarihi", ""];

export function CollectionsScreen({
  search,
  onSearchChange,
}: {
  search: CollectionSearch;
  onSearchChange: (patch: Partial<CollectionSearch>) => void;
}) {
  const { data } = useSuspenseQuery(collectionsQuery(search.status));
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Koleksiyonlar</h1>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Duruma göre filtrele"
            className="w-48"
            value={search.status ?? ""}
            onChange={(e) =>
              onSearchChange({
                status: (e.target.value || undefined) as CollectionSearch["status"],
              })
            }
          >
            <option value="">Tüm durumlar</option>
            {COLLECTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {collectionStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={() => setCreating(true)}>
            Yeni koleksiyon
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {HEADERS.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={HEADERS.length} className="text-center text-muted-foreground">
                  Koleksiyon yok.
                </TableCell>
              </TableRow>
            ) : (
              data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/admin/collections/$collectionId"
                      params={{ collectionId: String(c.id) }}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">
                      /collections/{c.slug}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={collectionStatusTone(c.status)}>
                        {collectionStatusLabel(c.status)}
                      </Badge>
                      {c.has_pending_change && <Badge tone="warn">Bekleyen değişiklik</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{c.product_count}</TableCell>
                  <TableCell>{c.published_at ? formatDate(c.published_at) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/admin/collections/$collectionId"
                        params={{ collectionId: String(c.id) }}
                        aria-label={`${c.name} düzenle`}
                      >
                        Düzenle
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={creating} onClose={() => setCreating(false)} title="Yeni koleksiyon">
        {creating && <CreateForm onClose={() => setCreating(false)} />}
      </Dialog>
    </div>
  );
}

/** A name is all a draft needs; the rest is set on its own page. */
export function CreateForm({
  onClose,
  closeOnCreate = true,
}: {
  onClose: () => void;
  /** The dialog closes itself on success; a page has nothing to close and just moves on. */
  closeOnCreate?: boolean;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async () =>
      (
        await adminApi.POST("/api/admin/collections", {
          body: { name: name.trim(), description: "", product_ids: [] },
        })
      ).data,
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: collectionKeys.all });
      if (closeOnCreate) onClose();
      if (created)
        await navigate({
          to: "/admin/collections/$collectionId",
          params: { collectionId: String(created.id) },
        });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu."),
  });
  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        create.mutate();
      }}
    >
      <div className="space-y-1">
        <label htmlFor="collection-name" className="block font-medium">
          Ad
        </label>
        <Input
          id="collection-name"
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" size="sm" disabled={create.isPending || name.trim() === ""}>
          Oluştur
        </Button>
      </div>
    </form>
  );
}
