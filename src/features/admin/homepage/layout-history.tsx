import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import type { Section } from "./layout";
import { homepageVersionsQuery, useRestoreHomepage } from "./queries";

/** Geçmiş: the approved versions of the layout, newest first. Everyone who can edit the layout
 * sees it; only the Owner restores one, which goes live as a new version. */
export function LayoutHistory({
  owner,
  blocked,
  onRestored,
}: {
  owner: boolean;
  /** Why restoring is off right now (unsaved edits, a waiting change), or null. */
  blocked: string | null;
  onRestored: (sections: Section[]) => void;
}) {
  const { data: versions } = useQuery(homepageVersionsQuery);
  const restore = useRestoreHomepage();
  const [busy, setBusy] = useState<number | null>(null);

  async function run(version: number) {
    if (!window.confirm(`Sürüm ${version} geri yüklensin mi? Hemen yayına çıkar.`)) return;
    setBusy(version);
    try {
      const done = await restore(version);
      onRestored(done.sections);
      toast.success(`Sürüm ${version} geri yüklendi ve yayında.`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Sürüm geri yüklenemedi.");
    } finally {
      setBusy(null);
    }
  }

  if (!versions || versions.length === 0) return null;
  const current = versions[0]?.version;
  return (
    <section aria-labelledby="layout-history" className="space-y-2 border-t border-border pt-3">
      <h2 id="layout-history" className="font-medium">
        Geçmiş
      </h2>
      {owner && blocked && <p className="text-muted-foreground">{blocked}</p>}
      <ul className="divide-y divide-border rounded-md border border-border">
        {versions.map((v) => (
          <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 p-2">
            <div>
              <span className="font-medium">Sürüm {v.version}</span>
              {v.version === current && <span className="text-muted-foreground"> · yayında</span>}
              <div className="text-muted-foreground">
                {formatDate(v.approved_at)} · {v.approved_by ?? "Sistem"} · {v.section_count} bölüm
              </div>
            </div>
            {owner && v.version !== current && (
              <Button
                size="sm"
                variant="outline"
                disabled={blocked !== null || busy !== null}
                onClick={() => void run(v.version)}
              >
                Geri yükle
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
