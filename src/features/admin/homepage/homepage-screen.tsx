import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useDirtyGuard } from "../forms/use-dirty-guard";
import {
  ADDABLE,
  addSection,
  DISPLAY_LABELS,
  type Display,
  displaysFor,
  dropSection,
  isDirty,
  MAX_SECTIONS,
  moveSection,
  pickMissing,
  removeSection,
  type Section,
  TYPE_LABELS,
  updateSection,
  updateSettings,
} from "./layout";
import { homepageLayoutQuery, useSaveHomepage } from "./queries";
import { SectionSettings } from "./section-settings";

const nameOf = (s: Section) => s.title || TYPE_LABELS[s.type];

/** Vitrin: the Owner's arrangement of the Storefront home page. Edits are a draft in this screen
 * until "Kaydet", which replaces the whole layout and goes live at once. */
export function HomepageScreen() {
  const { data: saved } = useSuspenseQuery(homepageLayoutQuery);
  const save = useSaveHomepage();
  const [draft, setDraft] = useState<Section[]>(saved);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState("");
  const dirty = isDirty(saved, draft);
  const incomplete = draft.find((s) => pickMissing(s) !== null);
  useDirtyGuard(dirty && !saving);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const label = (id: unknown) => {
    const s = draft.find((d) => d.id === id);
    return s ? nameOf(s) : "";
  };
  const position = (id: unknown) => draft.findIndex((d) => d.id === id) + 1;
  function onDragEnd({ active, over }: DragEndEvent) {
    if (over) setDraft(dropSection(draft, String(active.id), String(over.id)));
  }

  async function submit() {
    setSaving(true);
    try {
      setDraft(await save(draft));
      toast.success("Vitrin kaydedildi ve yayında.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Vitrin kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Vitrin</h1>
        <p className="text-muted-foreground">
          Mağazanın ana sayfasında gösterilen bölümler, yukarıdan aşağıya. Kaydedince hemen yayına
          çıkar.
        </p>
      </div>

      {draft.length === 0 ? (
        <p className="text-muted-foreground">Ana sayfada bölüm yok. “Bölüm ekle” ile ekleyin.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Bölümü tutmak için Boşluk veya Enter'a basın. Okla taşıyın, bırakmak için tekrar Boşluk veya Enter, vazgeçmek için Escape'e basın.",
            },
            announcements: {
              onDragStart: ({ active }) => `${label(active.id)} tutuldu.`,
              onDragOver: ({ active, over }) =>
                over ? `${label(active.id)}, ${position(over.id)}. sıraya taşınacak.` : "",
              onDragEnd: ({ active, over }) =>
                over
                  ? `${label(active.id)}, ${position(over.id)}. sıraya bırakıldı.`
                  : `${label(active.id)} bırakılmadı.`,
              onDragCancel: ({ active }) => `${label(active.id)} için taşıma iptal edildi.`,
            },
          }}
        >
          <SortableContext items={draft.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2">
              {draft.map((s, i) => (
                <SectionRow
                  key={s.id}
                  section={s}
                  first={i === 0}
                  last={i === draft.length - 1}
                  editing={open === s.id}
                  onEdit={() => setOpen(open === s.id ? null : s.id)}
                  onChange={(patch) => setDraft(updateSection(draft, s.id, patch))}
                  onSettings={(patch) => setDraft(updateSettings(draft, s.id, patch))}
                  onMove={(by) => setDraft(moveSection(draft, s.id, by))}
                  onRemove={() => setDraft(removeSection(draft, s.id))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="add-section" className="sr-only">
            Bölüm türü
          </label>
          <Select
            id="add-section"
            className="w-44"
            value={adding}
            disabled={draft.length >= MAX_SECTIONS}
            onChange={(e) => {
              const type = ADDABLE.find((t) => t === e.target.value);
              if (type) setDraft(addSection(draft, type));
              setAdding("");
            }}
          >
            <option value="">Bölüm ekle…</option>
            {ADDABLE.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <span className="text-muted-foreground">
            {draft.length}/{MAX_SECTIONS}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-muted-foreground">Kaydedilmemiş değişiklikler var.</span>}
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => setDraft(saved)}
          >
            Değişiklikleri at
          </Button>
          {incomplete && (
            <span role="alert" className="text-red-700">
              {nameOf(incomplete)}: {pickMissing(incomplete)}
            </span>
          )}
          <Button
            size="sm"
            disabled={!dirty || saving || incomplete !== undefined}
            onClick={() => void submit()}
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionRow({
  section,
  first,
  last,
  editing,
  onEdit,
  onChange,
  onSettings,
  onMove,
  onRemove,
}: {
  section: Section;
  first: boolean;
  last: boolean;
  editing: boolean;
  onEdit: () => void;
  onChange: (patch: Partial<Pick<Section, "title" | "link" | "visible" | "display">>) => void;
  onSettings: (patch: Parameters<typeof updateSettings>[2]) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  const name = nameOf(section);
  const displays = displaysFor(section.type);
  const field = (suffix: string) => `section-${section.id}-${suffix}`;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-md border border-border bg-card",
        isDragging && "relative z-10 opacity-90 shadow-lg",
        !section.visible && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`${name} sürükle`}
          className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded text-muted-foreground hover:bg-accent focus-visible:outline-2"
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{name}</div>
          <div className="text-muted-foreground">
            {TYPE_LABELS[section.type]}
            {!section.visible && " · gizli"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${name}: yukarı taşı`}
          disabled={first}
          onClick={() => onMove(-1)}
        >
          <ArrowUp aria-hidden className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${name}: aşağı taşı`}
          disabled={last}
          onClick={() => onMove(1)}
        >
          <ArrowDown aria-hidden className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={section.visible ? `${name}: gizle` : `${name}: göster`}
          aria-pressed={!section.visible}
          onClick={() => onChange({ visible: !section.visible })}
        >
          {section.visible ? (
            <Eye aria-hidden className="size-4" />
          ) : (
            <EyeOff aria-hidden className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${name}: ayarlar`}
          aria-expanded={editing}
          onClick={onEdit}
        >
          <Pencil aria-hidden className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`${name}: kaldır`} onClick={onRemove}>
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </div>
      {editing && (
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor={field("title")} className="block font-medium">
              Başlık
            </label>
            <Input
              id={field("title")}
              value={section.title}
              maxLength={120}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={field("link")} className="block font-medium">
              “Tümünü gör” bağlantısı
            </label>
            <Input
              id={field("link")}
              value={section.link}
              maxLength={300}
              placeholder="/ara?sort=newest"
              onChange={(e) => onChange({ link: e.target.value })}
            />
          </div>
          {displays.length > 0 && (
            <div className="space-y-1">
              <label htmlFor={field("display")} className="block font-medium">
                Görünüm
              </label>
              <Select
                id={field("display")}
                value={section.display}
                onChange={(e) => onChange({ display: e.target.value as Display })}
              >
                {displays.map((d) => (
                  <option key={d} value={d}>
                    {DISPLAY_LABELS[d]}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <SectionSettings section={section} onChange={onSettings} />
        </div>
      )}
    </li>
  );
}
