import { Button } from "@/components/ui/button";
import type { TreeRow } from "../category-order";

export type CategoryRowHandlers = {
  onAddChild: (id: number) => void;
  onEdit: (id: number) => void;
  onToggleHidden: (id: number) => void;
  onMove: (id: number) => void;
  onDelete: (id: number) => void;
  onUp: (id: number) => void;
  onDown: (id: number) => void;
};

/** The actions of one tree row. `canManage` is everyday catalogue editing (Owner and
 * Staff); `canRestructure` is the Owner-only move and delete. The API enforces both. */
export function CategoryRowActions({
  row,
  canManage,
  canRestructure,
  busy,
  onAddChild,
  onEdit,
  onToggleHidden,
  onMove,
  onDelete,
  onUp,
  onDown,
}: {
  row: TreeRow;
  canManage: boolean;
  canRestructure: boolean;
  busy: boolean;
} & CategoryRowHandlers) {
  const { category: c } = row;
  const reorderable = canManage && row.siblings > 1;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {reorderable && (
        <>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${c.name} yukarı taşı`}
            disabled={busy || row.index === 0}
            onClick={() => onUp(c.id)}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${c.name} aşağı taşı`}
            disabled={busy || row.index === row.siblings - 1}
            onClick={() => onDown(c.id)}
          >
            ↓
          </Button>
        </>
      )}
      {canManage && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`${c.name} alt kategori ekle`}
          title={row.canAddChild ? undefined : "En fazla beş seviye."}
          disabled={!row.canAddChild}
          onClick={() => onAddChild(c.id)}
        >
          + Alt
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        aria-label={`${c.name} ${canManage ? "düzenle" : "göster"}`}
        onClick={() => onEdit(c.id)}
      >
        {canManage ? "Düzenle" : "Göster"}
      </Button>
      {canManage && (
        <Button
          size="sm"
          variant="outline"
          aria-label={`${c.name} ${c.is_hidden ? "göster" : "gizle"}`}
          onClick={() => onToggleHidden(c.id)}
        >
          {c.is_hidden ? "Göster" : "Gizle"}
        </Button>
      )}
      {canRestructure && (
        <>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${c.name} taşı`}
            onClick={() => onMove(c.id)}
          >
            Taşı…
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${c.name} sil`}
            onClick={() => onDelete(c.id)}
          >
            Sil
          </Button>
        </>
      )}
    </div>
  );
}
