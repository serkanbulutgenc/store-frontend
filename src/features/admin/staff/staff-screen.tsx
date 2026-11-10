import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { type Column, columnHelper, DataTable } from "../data-table/data-table";
import type { ListSearch } from "../data-table/search";
import { ActionDialog } from "../forms/action-dialog";
import { type StaffUserOut, staffQuery, useDeactivateStaff, useInviteStaff } from "./queries";

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Geçerli bir e-posta girin."),
  name: z.string().trim().max(150),
});
const helper = columnHelper<StaffUserOut>();

export function StaffScreen({
  search,
  onSearchChange,
}: {
  search: Pick<ListSearch, "page" | "size">;
  onSearchChange: (patch: Partial<ListSearch>) => void;
}) {
  const { data, isFetching } = useSuspenseQuery(
    staffQuery({ page: search.page, size: search.size }),
  );
  const [inviting, setInviting] = useState(false);
  const invite = useInviteStaff();
  const deactivate = useDeactivateStaff();

  async function onDeactivate(u: StaffUserOut) {
    if (!window.confirm(`${u.email} devre dışı bırakılsın mı? Hesap silinmez, giriş yapamaz.`))
      return;
    try {
      await deactivate.mutateAsync(u.id);
      toast.success("Kullanıcı devre dışı bırakıldı.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "İşlem yapılamadı.");
    }
  }

  const columns: Column<StaffUserOut>[] = [
    helper.accessor("email", { header: "E-posta", enableSorting: false }),
    helper.accessor("name", { header: "Ad", enableSorting: false }),
    helper.accessor("role", {
      header: "Rol",
      enableSorting: false,
      cell: (c) => (c.getValue() === "owner" ? "Sahip" : "Personel"),
    }),
    helper.accessor("is_active", {
      header: "Durum",
      enableSorting: false,
      cell: (c) => (
        <Badge tone={c.getValue() ? "good" : "neutral"}>
          {c.getValue() ? "Aktif" : "Devre dışı"}
        </Badge>
      ),
    }),
    helper.accessor((r) => (r.last_login ? formatDate(r.last_login) : "—"), {
      id: "last_login",
      header: "Son giriş",
      enableSorting: false,
    }),
    helper.display({
      id: "actions",
      header: "",
      cell: (c) =>
        c.row.original.is_active && c.row.original.role !== "owner" ? (
          <Button size="sm" variant="outline" onClick={() => onDeactivate(c.row.original)}>
            Devre dışı bırak
          </Button>
        ) : null,
    }),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Personel</h1>
        <Button size="sm" onClick={() => setInviting(true)}>
          Personel davet et
        </Button>
      </div>
      <DataTable
        data={data.items}
        columns={columns}
        total={data.total}
        search={{ ...search }}
        onSearchChange={onSearchChange}
        isFetching={isFetching}
        searchable={false}
        emptyMessage="Personel yok."
      />
      <ActionDialog
        open={inviting}
        title="Personel davet et"
        intro="Davet e-postası gönderilir; kişi şifresini kendisi belirler. İki adımlı doğrulamayı sonradan kendisi açabilir."
        fields={[
          { name: "email", label: "E-posta" },
          { name: "name", label: "Ad" },
        ]}
        defaults={{ email: "", name: "" }}
        schema={inviteSchema}
        success="Davet gönderildi."
        submit={(v) => invite.mutateAsync(v)}
        onClose={() => setInviting(false)}
      />
    </div>
  );
}
