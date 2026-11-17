import type { AnyFieldApi } from "@tanstack/react-form";
import {
  Bold,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Table,
} from "lucide-react";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProductDescription } from "@/features/catalog/components/product-description";
import { cn } from "@/lib/utils";
import { Field } from "../../forms/field";
import {
  type Edit,
  imagesMissingAlt,
  insertImage,
  insertLink,
  insertTable,
  prefixLines,
  wrapSelection,
} from "../description-editor";
import { uploadDescriptionImage } from "../description-image";
import { DESCRIPTION_MAX, descriptionLength } from "../schemas";

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/**
 * A Product's Description: a Markdown textarea with a toolbar, a preview that uses the
 * storefront renderer, and image upload. `canUpload` hides the image button for users without
 * the photo permission.
 */
export function DescriptionEditor({
  field,
  canUpload,
  disabled,
}: {
  field: AnyFieldApi;
  canUpload: boolean;
  disabled?: boolean;
}) {
  const value = (field.state.value ?? "") as string;
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const selectAfter = useRef<{ start: number; end: number } | null>(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // The textarea is controlled, so a new selection can only be set once the new text is in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each text change
  useLayoutEffect(() => {
    const next = selectAfter.current;
    if (!next || !area.current) return;
    selectAfter.current = null;
    area.current.focus();
    area.current.setSelectionRange(next.start, next.end);
  }, [value]);

  function apply(change: (edit: Edit) => Edit) {
    const el = area.current;
    // An upload can finish while the preview is showing and the textarea is gone: the image
    // then goes at the end of the text instead of being lost.
    const text = el ? el.value : ((field.state.value ?? "") as string);
    const next = change(
      el
        ? { text, start: el.selectionStart, end: el.selectionEnd }
        : { text, start: text.length, end: text.length },
    );
    if (el) selectAfter.current = { start: next.start, end: next.end };
    field.handleChange(next.text);
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const url = await uploadDescriptionImage(file);
      apply((edit) => insertImage(edit, url));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  const length = descriptionLength(value);
  const missingAlt = imagesMissingAlt(value);
  const tools = disabled || preview;

  return (
    <Field field={field} label="Açıklama">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1">
          <div role="toolbar" aria-label="Biçimlendirme" className="flex flex-wrap gap-0.5">
            <ToolButton
              label="Kalın (Ctrl+B)"
              disabled={tools}
              onClick={() => apply((e) => wrapSelection(e, "**", "kalın metin"))}
            >
              <Bold aria-hidden className="size-4" />
            </ToolButton>
            <ToolButton
              label="İtalik (Ctrl+I)"
              disabled={tools}
              onClick={() => apply((e) => wrapSelection(e, "*", "italik metin"))}
            >
              <Italic aria-hidden className="size-4" />
            </ToolButton>
            <ToolButton
              label="Başlık"
              disabled={tools}
              onClick={() => apply((e) => prefixLines(e, "heading"))}
            >
              <Heading3 aria-hidden className="size-4" />
            </ToolButton>
            <ToolButton
              label="Madde listesi"
              disabled={tools}
              onClick={() => apply((e) => prefixLines(e, "bullet"))}
            >
              <List aria-hidden className="size-4" />
            </ToolButton>
            <ToolButton
              label="Numaralı liste"
              disabled={tools}
              onClick={() => apply((e) => prefixLines(e, "number"))}
            >
              <ListOrdered aria-hidden className="size-4" />
            </ToolButton>
            <ToolButton label="Bağlantı" disabled={tools} onClick={() => apply(insertLink)}>
              <LinkIcon aria-hidden className="size-4" />
            </ToolButton>
            <ToolButton label="Tablo" disabled={tools} onClick={() => apply(insertTable)}>
              <Table aria-hidden className="size-4" />
            </ToolButton>
            {canUpload && (
              <>
                <ToolButton
                  label="Görsel yükle"
                  disabled={tools || uploading}
                  onClick={() => picker.current?.click()}
                >
                  <ImagePlus aria-hidden className="size-4" />
                </ToolButton>
                <input
                  ref={picker}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Görsel dosyası seç"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void upload(file);
                  }}
                />
              </>
            )}
          </div>
          <div className="ml-auto flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={preview ? "outline" : "default"}
              aria-pressed={!preview}
              onClick={() => setPreview(false)}
            >
              Yazı
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preview ? "default" : "outline"}
              aria-pressed={preview}
              onClick={() => setPreview(true)}
            >
              Önizleme
            </Button>
          </div>
        </div>

        {preview ? (
          <div className="min-h-48 rounded-md border p-3" data-testid="description-preview">
            {value.trim() ? (
              <ProductDescription source={value} />
            ) : (
              <p className="text-muted-foreground">Önizlenecek bir şey yok.</p>
            )}
          </div>
        ) : (
          <Textarea
            ref={area}
            id={field.name}
            name={field.name}
            value={value}
            disabled={disabled}
            className="min-h-48 font-mono"
            aria-invalid={field.state.meta.errors.length > 0}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (!(e.ctrlKey || e.metaKey)) return;
              if (e.key === "b") {
                e.preventDefault();
                apply((x) => wrapSelection(x, "**", "kalın metin"));
              } else if (e.key === "i") {
                e.preventDefault();
                apply((x) => wrapSelection(x, "*", "italik metin"));
              }
            }}
          />
        )}

        <p className="text-muted-foreground text-sm" data-testid="description-hint">
          Markdown ile yazın: <code>**kalın**</code>, <code>*italik*</code>, <code>- madde</code>,{" "}
          <code>[metin](adres)</code>, <code>![açıklama](adres)</code>. Satır başına{" "}
          <code>###</code> koyarak başlık, <code>|</code> ile tablo yapabilirsiniz. HTML
          kullanılamaz.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 text-sm">
          {missingAlt > 0 && (
            <span role="status" className="text-amber-700">
              {missingAlt} görselin açıklaması (alt metni) eksik.
            </span>
          )}
          <span
            className={cn(
              "ml-auto tabular-nums",
              length > DESCRIPTION_MAX ? "text-red-700" : "text-muted-foreground",
            )}
          >
            {length} / {DESCRIPTION_MAX}
          </span>
        </div>
      </div>
    </Field>
  );
}
