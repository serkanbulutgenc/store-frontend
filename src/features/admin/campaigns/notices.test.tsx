import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BelowCostWarning, ProductCampaignNote } from "./notices";

describe("BelowCostWarning", () => {
  it("renders nothing when no Product falls below its cost", () => {
    expect(renderToString(<BelowCostWarning items={[]} />)).toBe("");
  });

  it("lists each Product with its Campaign price and cost price, and says saving still works", () => {
    const out = renderToString(
      <BelowCostWarning
        items={[
          { product_id: 1, title: "Yazlık Elbise", campaign_price: "79.99", cost_price: "90.00" },
          { product_id: 2, title: "Keten Gömlek", campaign_price: "40.00", cost_price: "45.50" },
        ]}
      />,
    );
    expect(out).toContain('role="alert"');
    expect(out).toContain("Maliyetin altında");
    expect(out).toContain("Yazlık Elbise");
    expect(out).toContain("₺79,99");
    expect(out).toContain("₺90,00");
    expect(out).toContain("Keten Gömlek");
    expect(out).toContain("₺45,50");
    // True both right after a save and when an existing Campaign is only opened: no "saved".
    expect(out).toContain("kaydedilir");
    expect(out).not.toContain("kaydedildi");
  });
});

describe("ProductCampaignNote", () => {
  it("renders nothing for a Product no Campaign prices", () => {
    expect(renderToString(<ProductCampaignNote campaign={null} />)).toBe("");
  });

  it("names the winning Campaign and its percentage", () => {
    const out = renderToString(
      <ProductCampaignNote campaign={{ id: 3, name: "Kara Cuma", percentage: "30.00" }} />,
    );
    expect(out).toContain("Kara Cuma");
    expect(out).toContain("%30");
  });
});
