import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoriesQuery } from "../catalog/queries";
import { useDirtyGuard } from "../forms/use-dirty-guard";
import { type MenuErrors, menuErrors } from "./errors";
import { typeLabel } from "./item";
import { ItemDialog } from "./item-dialog";
import { MENUS, type MenuKey, menuQuery, useSaveMenu } from "./queries";
import {
  addItem,
  categorySubtreeDepth,
  type ItemPath,
  isDimmed,
  isDirty,
  type MenuItemRow,
  moveItem,
  notShownText,
  removeItem,
  updateItem,
} from "./tree";

export function MenusScreen() {
  const [tab, setTab] = useState<MenuKey>("header");
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Menüler</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as MenuKey)}>
        <TabsList variant="line">
          {MENUS.map((m) => (
            <TabsTrigger key={m.key} value={m.key}>
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {/* Both editors stay mounted so an unsaved draft survives switching tabs. */}
      {MENUS.map((m) => (
        <div key={m.key} hidden={tab !== m.key}>
          <MenuEditor menuKey={m.key} />
        </div>
      ))}
    </div>
  );
}

type Dialogs =
  | { kind: "add"; parent: ItemPath }
  | { kind: "edit"; path: ItemPath }
  | { kind: "remove"; path: ItemPath }
  | null;

function itemAt(items: MenuItemRow[], path: ItemPath): MenuItemRow | undefined {
  let level = items;
  let found: MenuItemRow | undefined;
  for (const index of path) {
    found = level[index];
    if (!found) return undefined;
    level = found.children;
  }
  return found;
}

function MenuEditor({ menuKey }: { menuKey: MenuKey }) {
  const { data: saved } = useSuspenseQuery(menuQuery(menuKey));
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const save = useSaveMenu(menuKey);
  const [draft, setDraft] = useState<MenuItemRow[]>(saved.items);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<MenuErrors>({ top: [], items: [] });
  const dirty = isDirty(saved.items, draft);
  useDirtyGuard(dirty && !saving);

  const close = () => setDialog(null);
  const change = (next: MenuItemRow[]) => {
    setDraft(next);
    setErrors({ top: [], items: [] }); // the messages were about the tree as it was
  };

  async function submit() {
    setSaving(true);
    try {
      const result = await save(draft);
      setDraft(result.items);
      setErrors({ top: [], items: [] });
      toast.success("Menü kaydedildi ve yayında.");
    } catch (e) {
      setErrors(menuErrors(e));
    } finally {
      setSaving(false);
    }
  }

  const editing = dialog?.kind === "edit" ? itemAt(draft, dialog.path) : undefined;
  const removing = dialog?.kind === "remove" ? itemAt(draft, dialog.path) : undefined;
  const dialogDepth =
    dialog?.kind === "add"
      ? dialog.parent.length + 1
      : dialog?.kind === "edit"
        ? dialog.path.length
        : 1;

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground">
        {menuKey === "header"
          ? `Üst menü en fazla ${saved.depth_limit} seviye olabilir ve boş kaydedilemez.`
          : `Alt menü en fazla ${saved.depth_limit} seviye olabilir ve yasal sayfalar dizinine bir bağlantı içermelidir.`}{" "}
        Kaydettiğiniz değişiklik hemen yayına girer.
      </p>

      {errors.top.length > 0 && (
        <div
          role="alert"
          className="space-y-1 rounded-md border border-red-300 bg-red-50 p-3 text-red-800"
        >
          {errors.top.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
        {draft.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">Menüde öğe yok.</p>
        ) : (
          <ul>
            {draft.map((item, i) => (
              <Node
                // biome-ignore lint/suspicious/noArrayIndexKey: items have no id until saved
                key={i}
                items={draft}
                item={item}
                path={[i]}
                limit={saved.depth_limit}
                errors={errors.items}
                onAdd={(parent) => setDialog({ kind: "add", parent })}
                onEdit={(path) => setDialog({ kind: "edit", path })}
                onRemove={(path) => setDialog({ kind: "remove", path })}
                onToggle={(path, hidden) => change(updateItem(draft, path, { is_hidden: hidden }))}
                onMove={(path, direction) => change(moveItem(draft, path, direction))}
                siblings={draft.length}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "add", parent: [] })}>
          Öğe ekle
        </Button>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-muted-foreground">Kaydedilmemiş değişiklikler var.</span>}
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => change(saved.items)}
          >
            Değişiklikleri at
          </Button>
          <Button size="sm" disabled={!dirty || saving} onClick={() => void submit()}>
            Kaydet
          </Button>
        </div>
      </div>

      <ItemDialog
        open={dialog?.kind === "add" || (dialog?.kind === "edit" && editing !== undefined)}
        item={editing}
        depth={dialogDepth}
        limit={saved.depth_limit}
        subtreeDepth={(id) => categorySubtreeDepth(categories, id)}
        onClose={close}
        onSave={(item) => {
          if (dialog?.kind === "add") change(addItem(draft, dialog.parent, item));
          if (dialog?.kind === "edit") {
            const { children: _kept, ...fields } = item;
            change(updateItem(draft, dialog.path, fields));
          }
          close();
        }}
      />
      <Dialog open={removing !== undefined} onClose={close} title="Öğeyi sil">
        {removing && dialog?.kind === "remove" && (
          <div className="space-y-3">
            <p>
              <span className="font-medium">{removing.label || removing.target_label}</span> menüden
              çıkarılsın mı?
              {removing.children.length > 0 && " Altındaki öğeler de çıkarılır."} Değişiklik
              kaydedilene kadar yayına girmez.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={close}>
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  change(removeItem(draft, dialog.path));
                  close();
                }}
              >
                Sil
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Node({
  items,
  item,
  path,
  limit,
  errors,
  onAdd,
  onEdit,
  onRemove,
  onToggle,
  onMove,
  siblings,
}: {
  items: MenuItemRow[];
  item: MenuItemRow;
  path: ItemPath;
  limit: number;
  errors: MenuErrors["items"];
  onAdd: (parent: ItemPath) => void;
  onEdit: (path: ItemPath) => void;
  onRemove: (path: ItemPath) => void;
  onToggle: (path: ItemPath, hidden: boolean) => void;
  onMove: (path: ItemPath, direction: "up" | "down") => void;
  /** How many items share this item's parent. */
  siblings: number;
}) {
  const dimmed = isDimmed(items, path);
  const reason = notShownText(item.not_shown_reason);
  const name = item.label || item.target_label;
  const mine = errors.filter((e) => e.path.join(".") === path.join("."));
  return (
    <li>
      <div
        className={`flex items-start justify-between gap-2 border-b border-border px-3 py-2 ${dimmed ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${0.75 + (path.length - 1) * 1.5}rem` }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{name}</span>
            <Badge>{typeLabel(item.target_type)}</Badge>
            {item.include_subcategories && <Badge>Alt kategoriler dahil</Badge>}
            {item.is_hidden && <Badge>Gizli</Badge>}
          </div>
          {item.label && item.label !== item.target_label && item.target_label && (
            <span className="block text-muted-foreground">Hedef: {item.target_label}</span>
          )}
          {item.url && <span className="block text-muted-foreground">{item.url}</span>}
          {reason && <span className="block text-amber-700">{reason}</span>}
          {mine.map((e) => (
            <span key={`${e.field}-${e.message}`} role="alert" className="block text-red-700">
              {e.message}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="sm"
            variant="outline"
            aria-label={`${name} yukarı taşı`}
            disabled={path[path.length - 1] === 0}
            onClick={() => onMove(path, "up")}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${name} aşağı taşı`}
            disabled={path[path.length - 1] === siblings - 1}
            onClick={() => onMove(path, "down")}
          >
            ↓
          </Button>
          {path.length < limit && (
            <Button size="sm" variant="outline" onClick={() => onAdd(path)}>
              Alt öğe
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(path)}>
            Düzenle
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggle(path, !item.is_hidden)}>
            {item.is_hidden ? "Göster" : "Gizle"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={`${name} sil`}
            onClick={() => onRemove(path)}
          >
            Sil
          </Button>
        </div>
      </div>
      {item.children.length > 0 && (
        <ul>
          {item.children.map((child, i) => (
            <Node
              // biome-ignore lint/suspicious/noArrayIndexKey: items have no id until saved
              key={i}
              items={items}
              item={child}
              path={[...path, i]}
              limit={limit}
              errors={errors}
              onAdd={onAdd}
              onEdit={onEdit}
              onRemove={onRemove}
              onToggle={onToggle}
              onMove={onMove}
              siblings={item.children.length}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
