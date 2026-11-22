import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CampaignsTable,
  CsvButton,
  ProductsTable,
  ReportFailed,
  ReturnsTable,
  SalesChart,
  SalesSummary,
  VouchersTable,
} from "./report-parts";

const product = (over: object) => ({
  product_id: 1,
  title: "Yazlık Elbise",
  units: 12,
  revenue: "2400.00",
  previous_units: 10,
  previous_revenue: "2000.00",
  ...over,
});

describe("ProductsTable", () => {
  it("lists the Products in the order given, ranked, with units and revenue", () => {
    const out = renderToString(
      <ProductsTable
        rows={[
          product({}),
          product({ product_id: 2, title: "Keten Gömlek", units: 3, revenue: "1350.50" }),
        ]}
      />,
    );
    expect(out.indexOf("Yazlık Elbise")).toBeGreaterThan(-1);
    expect(out.indexOf("Yazlık Elbise")).toBeLessThan(out.indexOf("Keten Gömlek"));
    expect(out).toContain("₺2.400,00");
    expect(out).toContain("₺1.350,50");
    expect(out).toMatch(/>1<[\s\S]*Yazlık Elbise[\s\S]*>2<[\s\S]*Keten Gömlek/);
  });

  it("says how each Product's revenue moved against the period before", () => {
    const out = renderToString(
      <ProductsTable
        rows={[
          product({}),
          product({
            product_id: 2,
            title: "Keten Gömlek",
            revenue: "50.00",
            previous_revenue: "100.00",
          }),
          product({
            product_id: 3,
            title: "Yeni Ürün",
            previous_revenue: "0.00",
            previous_units: 0,
          }),
        ]}
      />,
    );
    expect(out).toContain("%20 artış");
    expect(out).toContain("%50 azalış");
    expect(out).toContain("Önceki dönemde veri yok");
  });

  it("says so, instead of an empty table, when nothing sold", () => {
    const out = renderToString(<ProductsTable rows={[]} />);
    expect(out).toContain("Bu dönemde satış yok");
    expect(out).not.toContain("<table");
  });
});

const totals = (over: object = {}) => ({
  orders: 10,
  items: 25,
  revenue: "5000.00",
  average_order: "500.00",
  ...over,
});
const sales = (over: object = {}) => ({
  totals: totals(),
  previous_totals: totals({ orders: 8, items: 25, revenue: "4000.00", average_order: "500.00" }),
  pending: { orders: 0, revenue: "0.00" },
  fees: { shipping: "0.00", cod: "0.00" },
  ...over,
});

describe("SalesSummary", () => {
  it("shows orders, items, revenue and average order, each against the period before", () => {
    const out = renderToString(<SalesSummary report={sales()} />);
    for (const label of ["Sipariş", "Ürün adedi", "Ciro", "Ortalama sepet"])
      expect(out).toContain(label);
    expect(out).toContain("₺5.000,00");
    expect(out).toContain("₺500,00");
    expect(out).toContain("%25 artış"); // orders 8 -> 10
    expect(out).toContain("%25 artış"); // revenue 4000 -> 5000
    expect(out).toContain("Değişmedi"); // items 25 -> 25
  });

  it("shows pending bank transfers apart, only when there are some", () => {
    expect(renderToString(<SalesSummary report={sales()} />)).not.toContain("Ödeme bekleyen");
    const out = renderToString(
      <SalesSummary report={sales({ pending: { orders: 2, revenue: "799.80" } })} />,
    );
    expect(out).toContain("Ödeme bekleyen");
    expect(out).toContain("2 sipariş");
    expect(out).toContain("₺799,80");
  });

  it("shows the shipping and cash-on-delivery fees apart from the revenue", () => {
    const out = renderToString(
      <SalesSummary report={sales({ fees: { shipping: "120.00", cod: "45.50" } })} />,
    );
    expect(out).toContain("Kargo ücreti");
    expect(out).toContain("₺120,00");
    expect(out).toContain("Kapıda ödeme ücreti");
    expect(out).toContain("₺45,50");
  });
});

describe("SalesChart", () => {
  const points = [
    { period: "2026-11-01", label: "1 Kas", value: 100 },
    { period: "2026-11-02", label: "2 Kas", value: 50 },
    { period: "2026-11-03", label: "3 Kas", value: 0 },
  ];
  const heights = (out: string) =>
    [...out.matchAll(/<rect[^>]*data-bar[^>]*height="([\d.]+)"/g)].map((m) => Number(m[1]));

  it("draws a bar per point, the tallest at full height and the rest in proportion", () => {
    expect(heights(renderToString(<SalesChart points={points} />))).toEqual([160, 80, 0]);
  });

  it("gives every bar its day and revenue as text, so the chart is not only a picture", () => {
    const out = renderToString(<SalesChart points={points} />);
    expect(out).toContain('role="img"');
    expect(out).toContain("1 Kas: ₺100,00");
    expect(out).toContain("2 Kas: ₺50,00");
    expect(out).toContain("3 Kas: ₺0,00");
  });

  it("does not divide by zero when every point is zero", () => {
    const out = renderToString(<SalesChart points={points.map((p) => ({ ...p, value: 0 }))} />);
    expect(heights(out)).toEqual([0, 0, 0]);
    expect(out).not.toContain("NaN");
  });

  it("says so, instead of an empty chart, when there are no points", () => {
    const out = renderToString(<SalesChart points={[]} />);
    expect(out).toContain("Bu dönemde satış yok");
    expect(out).not.toContain("<svg");
  });
});

describe("CsvButton", () => {
  it("offers the download", () => {
    const out = renderToString(<CsvButton pending={false} failed={false} onClick={() => {}} />);
    expect(out).toContain("CSV indir");
    expect(out).not.toContain('disabled=""');
  });

  it("is disabled while the file is on its way, so it cannot be started twice", () => {
    const out = renderToString(<CsvButton pending failed={false} onClick={() => {}} />);
    expect(out).toContain("İndiriliyor");
    expect(out).toContain('disabled=""');
  });

  it("says when the download failed, as an alert", () => {
    const out = renderToString(<CsvButton pending={false} failed onClick={() => {}} />);
    expect(out).toContain('role="alert"');
    expect(out).toContain("CSV indirilemedi");
  });
});

describe("ReportFailed", () => {
  it("says the report could not be loaded, as an alert, with a retry", () => {
    const out = renderToString(<ReportFailed onRetry={() => {}} />);
    expect(out).toContain('role="alert"');
    expect(out).toContain("Rapor yüklenemedi");
    expect(out).toContain("Tekrar dene");
  });
});

const none = {
  wrong_size: 0,
  changed_mind: 0,
  defective: 0,
  wrong_item: 0,
  other: 0,
  unspecified: 0,
};

describe("ReturnsTable", () => {
  const rows = [
    {
      key: "1",
      name: "Yazlık Elbise",
      shipped: 16,
      returned: 2,
      rate: 12.5,
      reasons: { ...none, wrong_size: 2 },
    },
    {
      key: "2",
      name: "Keten Gömlek",
      shipped: 4,
      returned: 1,
      rate: null,
      reasons: { ...none, unspecified: 1 },
    },
  ];

  it("shows the rate with its counts, and the reason mix", () => {
    const out = renderToString(<ReturnsTable nameHeader="Ürün" rows={rows} />);
    expect(out).toContain("Ürün");
    expect(out).toContain("Yazlık Elbise");
    expect(out).toContain("%12,5 (2 / 16 adet)");
    expect(out).toContain("Beden uymadı: 2");
  });

  it("shows counts only, no percentage, for a row with too few units, and names a whole-Order return Belirtilmedi", () => {
    const out = renderToString(
      <ReturnsTable nameHeader="Ürün" rows={[rows[1] as (typeof rows)[number]]} />,
    );
    expect(out).toContain("1 / 4 adet");
    expect(out).not.toContain("%");
    expect(out).toContain("Belirtilmedi: 1");
  });

  it("says so, instead of an empty table, when nothing was shipped", () => {
    const out = renderToString(<ReturnsTable nameHeader="Beden" rows={[]} />);
    expect(out).toContain("Bu dönemde iade verisi yok");
    expect(out).not.toContain("<table");
  });
});

describe("CampaignsTable and VouchersTable", () => {
  it("lists the discount each Campaign gave, with its orders and revenue", () => {
    const out = renderToString(
      <CampaignsTable
        rows={[
          {
            campaign_id: 1,
            name: "Yaz İndirimi",
            orders: 12,
            revenue: "4800.00",
            discount: "1200.00",
          },
        ]}
      />,
    );
    expect(out).toContain("Yaz İndirimi");
    expect(out).toContain("₺4.800,00");
    expect(out).toContain("₺1.200,00");
    expect(out).toMatch(/>12</);
  });

  it("lists the discount each Voucher gave, by its code", () => {
    const out = renderToString(
      <VouchersTable
        rows={[{ code: "HOSGELDIN", orders: 3, revenue: "900.00", discount: "90.00" }]}
      />,
    );
    expect(out).toContain("HOSGELDIN");
    expect(out).toContain("₺900,00");
    expect(out).toContain("₺90,00");
  });

  it("says so, instead of an empty table, when none was used", () => {
    expect(renderToString(<CampaignsTable rows={[]} />)).toContain(
      "Bu dönemde kampanya satışı yok",
    );
    expect(renderToString(<VouchersTable rows={[]} />)).toContain("Bu dönemde kupon kullanılmadı");
    expect(renderToString(<VouchersTable rows={[]} />)).not.toContain("<table");
  });
});
