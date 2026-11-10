/**
 * Static legal pages. The text lives in `content/*.md` (placeholder until the lawyer
 * supplies it); `key` is the backend's Legal page identifier and `version` is the version
 * of the text in this repo. Bump `version` together with the Store setting on deploy.
 */
import about from "./content/about-contact.md?raw";
import delivery from "./content/delivery-shipping.md?raw";
import contract from "./content/distance-sales-contract.md?raw";
import payment from "./content/payment-methods.md?raw";
import preInfo from "./content/pre-information-form.md?raw";
import privacy from "./content/privacy-notice.md?raw";
import returns from "./content/returns-withdrawal.md?raw";

export type LegalPage = {
  key: string;
  slug: string;
  title: string;
  version: string;
  body: string;
};

export const LEGAL_PAGES: LegalPage[] = [
  {
    key: "distance_sales_contract",
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    version: "1",
    body: contract,
  },
  {
    key: "pre_information_form",
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    version: "1",
    body: preInfo,
  },
  {
    key: "returns_withdrawal",
    slug: "iade-ve-cayma-kosullari",
    title: "İade ve Cayma Koşulları",
    version: "1",
    body: returns,
  },
  {
    key: "privacy_notice",
    slug: "gizlilik-ve-kvkk",
    title: "Gizlilik ve KVKK Aydınlatma Metni",
    version: "1",
    body: privacy,
  },
  {
    key: "delivery_shipping",
    slug: "teslimat-ve-kargo",
    title: "Teslimat ve Kargo",
    version: "1",
    body: delivery,
  },
  {
    key: "payment_methods",
    slug: "odeme-yontemleri",
    title: "Ödeme Yöntemleri",
    version: "1",
    body: payment,
  },
  {
    key: "about_contact",
    slug: "hakkimizda-iletisim",
    title: "Hakkımızda / İletişim",
    version: "1",
    body: about,
  },
];

export const legalBySlug = (slug: string) => LEGAL_PAGES.find((p) => p.slug === slug);
export const legalByKey = (key: string) => LEGAL_PAGES.find((p) => p.key === key);
