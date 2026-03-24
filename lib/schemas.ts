import { z } from "zod";

export const deliveryPayloadSchema = z.object({
  deliveryNumber: z
    .string()
    .min(1, "Delivery number is required")
    .max(30),
  date: z.string().min(1, "Date is required"),
  customerName: z
    .string()
    .min(1, "Customer name is required")
    .max(200),
  customerEmail: z
    .string()
    .email("Invalid email address")
    .max(254),
  address: z.string().max(500).default(""),
  ico: z.string().max(20).default(""),
  icdph: z.string().max(20).default(""),
  quantity: z.number().int().min(0).max(100_000),
  freeQuantity: z.number().int().min(0).max(100_000),
  priceWithVat: z.number().min(0).max(1_000),
  totalWithoutVat: z.number().min(0).max(10_000_000),
  vatAmount: z.number().min(0).max(10_000_000),
  totalWithVat: z.number().min(0).max(10_000_000),
  signatureData: z.string().min(1, "Signature is required"),
});

export type DeliveryPayloadInput = z.infer<typeof deliveryPayloadSchema>;
