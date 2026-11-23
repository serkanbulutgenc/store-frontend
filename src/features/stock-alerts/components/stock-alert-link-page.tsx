import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import { linkProblem } from "../messages";
import { useConfirmStockAlert, useRejectStockAlert } from "../queries";

const COPY = {
  confirm: {
    title: "Stok bildirimini onayla",
    intro:
      "Onayladığınızda, bu ürün stoğa girdiğinde size bir kez e-posta göndereceğiz. Onayınız, ticari elektronik ileti izniniz olarak kaydedilir.",
    button: "Onayla",
    done: "Teşekkürler, kaydınız tamamlandı. Ürün stoğa girince e-posta ile haber vereceğiz.",
  },
  reject: {
    title: "Stok bildiriminden vazgeç",
    intro: "Vazgeçerseniz bu ürün için bekleyen bildiriminiz silinir ve size e-posta gönderilmez.",
    button: "Vazgeç",
    done: "Bildiriminiz silindi. Bu ürün için size e-posta göndermeyeceğiz.",
  },
} as const;

/**
 * The page behind the confirm and reject links in the emails. The token acts only on the
 * button press, never on load, so a mail scanner that opens the link cannot consent for anyone.
 */
export function StockAlertLinkPage({
  action,
  token,
}: {
  action: "confirm" | "reject";
  token: string | undefined;
}) {
  const confirm = useConfirmStockAlert();
  const reject = useRejectStockAlert();
  const run = action === "confirm" ? confirm : reject;
  const copy = COPY[action];

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">{copy.title}</h1>
      {!token ? (
        <p role="alert" className="rounded-md bg-muted px-3 py-2">
          {linkProblem(action, new ApiError(404, "not_found", ""))}
        </p>
      ) : run.isSuccess ? (
        <>
          <p role="status" className="rounded-md bg-muted px-3 py-2">
            {copy.done}
          </p>
          <Link to="/" className="inline-block underline underline-offset-4">
            Alışverişe devam et
          </Link>
        </>
      ) : (
        <>
          <p>{copy.intro}</p>
          {run.isError && (
            <p role="alert" className="rounded-md bg-muted px-3 py-2">
              {linkProblem(action, run.error)}
            </p>
          )}
          <Button size="lg" disabled={run.isPending} onClick={() => run.mutate(token)}>
            {copy.button}
          </Button>
        </>
      )}
    </main>
  );
}
