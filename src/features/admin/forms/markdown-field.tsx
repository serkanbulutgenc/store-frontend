import { type ChangeEvent, type FocusEventHandler, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/features/legal/markdown";

/** A Markdown text box with a Yazı / Önizleme toggle, as in the Product Description: one box that
 * is either the text or its preview, never both. The preview uses the storefront's renderer. */
export function MarkdownField({
  id,
  name,
  value,
  onChange,
  onBlur,
  rows = 14,
  maxLength,
  invalid,
  disabled,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  rows?: number;
  maxLength?: number;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-1">
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
      {preview ? (
        <div className="min-h-24 rounded-md border p-3" data-testid="markdown-preview">
          {value.trim() ? (
            <Markdown source={value} />
          ) : (
            <p className="text-muted-foreground">Önizlenecek bir şey yok.</p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          name={name}
          rows={rows}
          maxLength={maxLength}
          value={value}
          disabled={disabled}
          className="font-mono text-xs"
          aria-invalid={invalid}
          onBlur={onBlur}
          onChange={onChange}
        />
      )}
    </div>
  );
}
