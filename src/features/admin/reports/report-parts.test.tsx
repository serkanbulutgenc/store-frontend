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

  // Recharts draws only in a browser (it measures its box), so what a unit test can hold is the text alternative that
  // sits beside the bars: the same figures, for a screen reader. The bars themselves are checked in the browser.
  it("gives a screen reader every point's day and revenue in a table, in order", () => {
    const out = renderToString(<SalesChart points={points} />);
    expect(out).toContain("sr-only");
    expect(out).toContain("<caption");
    expect(out.indexOf("1 Kas")).toBeGreaterThan(-1);
    expect(out.indexOf("1 Kas")).toBeLessThan(out.indexOf("2 Kas"));
    expect(out).toContain("₺100,00");
    expect(out).toContain("₺50,00");
    expect(out).toContain("₺0,00");
  });

  it("hides the drawing from a screen reader, so the figures are not read twice", () => {
    expect(renderToString(<SalesChart points={points} />)).toContain('aria-hidden="true"');
  });

  it("does not break when every point is zero", () => {
    const out = renderToString(<SalesChart points={points.map((p) => ({ ...p, value: 0 }))} />);
    expect(out).not.toContain("NaN");
    expect(out).toContain("₺0,00");
  });

  it("says so, instead of an empty chart, when there are no points", () => {
    const out = renderToString(<SalesChart points={[]} />);
    expect(out).toContain("Bu dönemde satış yok");
    expect(out).not.toContain("<table");
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

/** React puts <!-- --> between adjacent text nodes; the reader never sees it. */
const text = (markup: string) => markup.replaceAll("<!-- -->", "");

describe("paging the tables", () => {
  const many = Array.from({ length: 12 }, (_, i) =>
    product({ product_id: i + 1, title: `Ürün ${i + 1}` }),
  );

  it("shows ten rows of a long ranking, how many there are in all, and a way to the next page", () => {
    const out = text(renderToString(<ProductsTable rows={many} />));
    expect(out).toContain("Ürün 10<");
    expect(out).not.toContain("Ürün 11<");
    expect(out).toContain("12 kayıt");
    expect(out).toContain("1 / 2");
    expect(out).toContain("10 / sayfa");
    expect(out).toContain("Sonraki");
  });

  it("does not offer a next page for a short ranking", () => {
    const out = text(renderToString(<ProductsTable rows={many.slice(0, 3)} />));
    expect(out).toContain("3 kayıt");
    expect(out).toContain("1 / 1");
  });

  it("pages the Voucher and Returns tables the same way", () => {
    const vouchers = Array.from({ length: 11 }, (_, i) => ({
      code: `KOD${i + 1}`,
      orders: 1,
      revenue: "90.00",
      discount: "10.00",
    }));
    const out = text(renderToString(<VouchersTable rows={vouchers} />));
    expect(out).toContain("KOD10<");
    expect(out).not.toContain("KOD11<");
    expect(out).toContain("11 kayıt");

    const returns = Array.from({ length: 11 }, (_, i) => ({
      key: String(i),
      name: `Beden ${i + 1}`,
      shipped: 20,
      returned: 2,
      rate: 10,
      reasons: none,
    }));
    const returned = renderToString(<ReturnsTable nameHeader="Beden" rows={returns} />);
    expect(returned).toContain("Beden 10<");
    expect(returned).not.toContain("Beden 11<");
  });
});

describe("icons", () => {
  it("marks each headline figure with its own icon", () => {
    const out = renderToString(<SalesSummary report={sales()} />);
    for (const icon of ["shopping-cart", "package", "banknote", "receipt"])
      expect(out).toContain(`lucide-${icon}`);
  });

  it("shows the direction of a change as an icon next to its words, never instead of them", () => {
    const up = renderToString(<SalesSummary report={sales()} />);
    expect(up).toContain("lucide-trending-up");
    expect(up).toContain("%25 artış");
    expect(up).toContain("lucide-minus"); // items 25 -> 25
    expect(up).toContain("Değişmedi");

    const down = renderToString(
      <SalesSummary report={sales({ previous_totals: totals({ revenue: "10000.00" }) })} />,
    );
    expect(down).toContain("lucide-trending-down");
    expect(down).toContain("%50 azalış");
  });

  it("puts an icon on the CSV button, a spinner while the file is on its way", () => {
    expect(
      renderToString(<CsvButton pending={false} failed={false} onClick={() => {}} />),
    ).toContain("lucide-download");
    const busy = renderToString(<CsvButton pending failed={false} onClick={() => {}} />);
    expect(busy).toContain("lucide-loader-circle");
    expect(busy).not.toContain("lucide-download");
  });

  it("puts an alert icon on a failed report and a retry icon on its button", () => {
    const out = renderToString(<ReportFailed onRetry={() => {}} />);
    expect(out).toContain("lucide-circle-alert");
    expect(out).toContain("lucide-refresh-cw");
  });
});
