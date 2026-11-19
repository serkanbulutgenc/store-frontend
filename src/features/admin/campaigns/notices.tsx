import { formatTry } from "@/lib/format";
import type { CampaignRow } from "./form";
import { percentageText } from "./rules";

/**
 * Products the Campaign would sell under their cost price. It only warns: the Campaign is
 * saved either way, so the wording says so. The API reports this with a saved Campaign, and the
 * edit form shows it for one that is merely opened, so the wording must not say it was just saved.
 */
export function BelowCostWarning({ items }: { items: CampaignRow["below_cost"] }) {
  if (items.length === 0) return null;
  return (
    <div role="alert" className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="font-medium text-amber-900">
        Maliyetin altında satılacak {items.length} ürün var
      </p>
      <p className="text-amber-900">
        Kampanya yine de kaydedilir; bu ürünlerde kampanya fiyatı maliyet fiyatının altında kalıyor.
      </p>
      <ul className="space-y-1 text-amber-900">
        {items.map((p) => (
          <li key={p.product_id}>
            <span className="font-medium">{p.title}</span>: kampanya fiyatı{" "}
            {formatTry(p.campaign_price)}, maliyet {formatTry(p.cost_price)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** On the Product screen: which Campaign prices this Product right now, if any. */
export function ProductCampaignNote({
  campaign,
}: {
  campaign: { id: number; name: string; percentage: string } | null;
}) {
  if (!campaign) return null;
  return (
    <p className="rounded-md border border-border bg-muted px-3 py-2">
      Şu an <span className="font-medium">{campaign.name}</span> kampanyasında (
      {percentageText(campaign.percentage)} indirim).
    </p>
  );
}
