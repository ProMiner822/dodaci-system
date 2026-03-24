export interface Company {
  id: string;
  name: string;
  email: string;
  priceWithVat: number;
  ico: string;
  icdph: string;
  dic: string;
  address: string;
}

export interface Supplier {
  name: string;
  address1: string;
  address2: string;
  country: string;
  ico: string;
  icdph: string;
  dic: string;
  email: string;
  phone: string;
}

export interface DeliveryPayload {
  deliveryNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  address: string;
  ico: string;
  icdph: string;
  quantity: number;
  freeQuantity: number;
  priceWithVat: number;
  totalWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
  signatureData: string;
}

export interface DeliveryCalculations {
  priceWithoutVat: number;
  vatPerPiece: number;
  totalWithVat: number;
  totalWithoutVat: number;
  vatAmount: number;
}
