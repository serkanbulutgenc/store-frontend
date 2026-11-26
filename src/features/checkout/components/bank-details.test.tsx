import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { BankDetails } from "./confirmation-page";

const ziraat = {
  name: "Ziraat",
  account_holder: "Auraa Giyim",
  iban: "TR330006100519786457841326",
};
const isbank = {
  name: "İş Bankası",
  account_holder: "Auraa Giyim",
  iban: "TR320010009999901234567890",
};

const html = (accounts: (typeof ziraat)[]) =>
  renderToStaticMarkup(<BankDetails bank={{ accounts, reference: "AT-ABC123" }} total="230.00" />);

it("shows a single account without saying to pick one", () => {
  const out = html([ziraat]);
  expect(out).toContain("Ziraat");
  expect(out).toContain(ziraat.iban);
  expect(out).not.toContain("birine gönderebilirsiniz");
});

it("lists every account in the Owner's order and says any one will do", () => {
  const out = html([isbank, ziraat]);
  expect(out).toContain("birine gönderebilirsiniz");
  expect(out.indexOf(isbank.iban)).toBeLessThan(out.indexOf(ziraat.iban));
});

it("shows the order number to write in the transfer once", () => {
  const out = html([ziraat, isbank]);
  expect(out.match(/AT-ABC123/g)).toHaveLength(1);
});
