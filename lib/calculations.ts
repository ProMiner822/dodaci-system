import type { DeliveryCalculations } from "./types";
import { VAT_RATE } from "./constants";

export function calculateDeliveryPrices(
  quantity: number,
  priceWithVat: number,
  vatRate: number = VAT_RATE,
): DeliveryCalculations {
  const priceWithoutVat = priceWithVat / (1 + vatRate);
  const vatPerPiece = priceWithVat - priceWithoutVat;
  const totalWithVat = quantity * priceWithVat;
  const totalWithoutVat = quantity * priceWithoutVat;
  const vatAmount = totalWithVat - totalWithoutVat;

  return {
    priceWithoutVat,
    vatPerPiece,
    totalWithVat,
    totalWithoutVat,
    vatAmount,
  };
}
