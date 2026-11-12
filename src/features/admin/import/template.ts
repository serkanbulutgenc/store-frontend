/** The header and sample rows of `store-infra/docs/launch/stock-template.csv`. */
const TEMPLATE = [
  "product_name,category,product_class,colour,size,shelf_price_try,quantity,brand,supplier,sku,kdv_class,notes",
  "Çiçekli Elbise,Kadın > Elbise,Giyim,Siyah,M,499.90,5,Aura Moda,Tedarikçi A,,,Örnek satır: silin",
  "Çiçekli Elbise,Kadın > Elbise,Giyim,Siyah,L,499.90,3,Aura Moda,Tedarikçi A,,,",
  "Çiçekli Elbise,Kadın > Elbise,Giyim,Kırmızı,M,519.90,2,Aura Moda,Tedarikçi A,,,",
];

/** With a BOM so Excel opens the Turkish letters correctly. */
export const TEMPLATE_CSV = `﻿${TEMPLATE.join("\n")}\n`;
export const TEMPLATE_FILENAME = "stok-sablonu.csv";
