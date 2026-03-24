import type { Company, Supplier } from "./types";

export const VAT_RATE = 0.19;
export const PRODUCT_NAME = "Avokado hass";
export const CURRENCY = "EUR";
export const DEFAULT_NOTE = "Tovar prevzatý bez zjavných poškodení.";

export const STORAGE_KEYS = {
  form: "dodaci-system-avokado",
  lastDate: "dodaci-system-last-date",
  lastCount: "dodaci-system-last-count",
  history: "dodaci-system-history",
} as const;

export const supplier: Supplier = {
  name: "Adrián Zachar - Tropic",
  address1: "Budatínska 3230/16A",
  address2: "851 06 Bratislava - mestská časť Petržalka",
  country: "Slovensko",
  ico: "55723748",
  icdph: "SK1129257998",
  dic: "1129257998",
  email: "zachar.ado@gmail.com",
  phone: "0951407519",
};

export const defaultCompanies: Company[] = [
  {
    id: "1",
    name: "EDOKIN Cubicon",
    email: "zachar@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "Stare Grunty 24, Bratislava",
  },
  {
    id: "2",
    name: "EDOKIN Blumental",
    email: "chmelar@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "Namestie Mateja Korvina 1, Bratislava",
  },
  {
    id: "3",
    name: "EDOKIN Central",
    email: "babos@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "OC Central Metodova 6, Bratislava",
  },
  {
    id: "4",
    name: "EDOKIN BoryMall",
    email: "balog@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "BoryMall Bratislava",
  },
];
