import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { type CategoryRow, categoriesQuery, contactCalls, useContactMutation } from "./queries";

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";

/** The Owner's list of contact form categories: add, rename, turn off or on, delete an unused one. */
export function CategoriesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useQuery({ ...categoriesQuery(), enabled: open });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const add = useContactMutation((n: string) => contactCalls.addCategory(n));
  const fail = (e: unknown) => setError(message(e));
  return (
    <Dialog open={open} onClose={onClose} title="Kategoriler">
      <div className="space-y-3 text-sm">
        <ul className="space-y-2">
          {(data ?? []).map((c) => (
            <CategoryItem key={c.id} category={c} onError={fail} />
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            add.mutate(name, {
              onSuccess: () => {
                setName("");
                toast.success("Kategori eklendi.");
              },
              onError: fail,
            });
          }}
        >
          <Input
            aria-label="Yeni kategori adı"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!name.trim() || add.isPending}>
            Ekle
          </Button>
        </form>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function CategoryItem({
  category,
  onError,
}: {
  category: CategoryRow;
  onError: (e: unknown) => void;
}) {
  const [name, setName] = useState(category.name);
  const patch = useContactMutation((p: { name?: string; is_active?: boolean }) =>
    contactCalls.patchCategory(category.id, p),
  );
  const remove = useContactMutation(() => contactCalls.removeCategory(category.id));
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Input
        aria-label={`${category.name} adı`}
        className="max-w-56"
        value={name}
        maxLength={100}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name.trim() && name !== category.name) patch.mutate({ name }, { onError: onError });
          else setName(category.name);
        }}
      />
      <span className="text-muted-foreground">{category.thread_count} yazışma</span>
      {!category.is_active && <Badge>Kapalı</Badge>}
      <Button
        size="sm"
        variant="outline"
        onClick={() => patch.mutate({ is_active: !category.is_active }, { onError })}
      >
        {category.is_active ? "Kapat" : "Aç"}
      </Button>
      {category.thread_count === 0 && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`${category.name} sil`}
          onClick={() => remove.mutate(undefined, { onError })}
        >
          Sil
        </Button>
      )}
    </li>
  );
}
