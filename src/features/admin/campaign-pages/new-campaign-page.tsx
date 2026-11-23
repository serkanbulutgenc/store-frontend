import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/clients";
import { ApiError } from "@/lib/api/errors";
import { pageKeys } from "./queries";

/** A title is all a draft needs; the rest is set on its own page. */
export function NewCampaignPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async () =>
      (
        await adminApi.POST("/api/admin/campaign-pages", {
          body: { title: title.trim(), description: "" },
        })
      ).data,
    onSuccess: async (created) => {
      await qc.invalidateQueries({ queryKey: pageKeys.all });
      if (created)
        await navigate({
          to: "/admin/campaign-pages/$pageId",
          params: { pageId: String(created.id) },
        });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu."),
  });
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Yeni kampanya sayfası</h1>
      <form
        className="max-w-xl space-y-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          create.mutate();
        }}
      >
        <div className="space-y-1">
          <label htmlFor="campaign-page-title" className="block font-medium">
            Başlık
          </label>
          <Input
            id="campaign-page-title"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/admin/campaigns" search={{ tab: "pages" }}>
              Vazgeç
            </Link>
          </Button>
          <Button type="submit" size="sm" disabled={create.isPending || title.trim() === ""}>
            Oluştur
          </Button>
        </div>
      </form>
    </div>
  );
}
