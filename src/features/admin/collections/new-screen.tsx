import { useNavigate } from "@tanstack/react-router";
import { CreateForm } from "./collections-screen";

/** The "Yeni koleksiyon" entry of the sidebar: the same one-field form as the list's dialog. */
export function NewCollectionScreen() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-lg font-semibold">Yeni koleksiyon</h1>
      <CreateForm
        closeOnCreate={false}
        onClose={() => void navigate({ to: "/admin/collections" })}
      />
    </div>
  );
}
