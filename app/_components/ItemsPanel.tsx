"use client";

interface ItemsPanelProps {
  deliveryNumber: string;
  date: string;
  quantity: number;
  freeQuantity: number;
  priceWithVat: number;
  note: string;
  onDeliveryNumberChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onFreeQuantityChange: (value: number) => void;
  onPriceChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  errors?: Record<string, string>;
}

export default function ItemsPanel({
  deliveryNumber,
  date,
  quantity,
  freeQuantity,
  priceWithVat,
  note,
  onDeliveryNumberChange,
  onDateChange,
  onQuantityChange,
  onFreeQuantityChange,
  onPriceChange,
  onNoteChange,
  errors = {},
}: ItemsPanelProps) {
  const inputClass = (field: string) =>
    `w-full min-h-[44px] rounded-lg border bg-surface px-3 py-3 text-base transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      errors[field] ? "border-danger" : "border-border"
    }`;

  return (
    <div className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
      <h2 className="mb-3 text-lg font-bold">Položky</h2>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="delivery-number" className="mb-1.5 block text-sm font-bold">
            Číslo dodacieho listu
          </label>
          <input
            id="delivery-number"
            className={inputClass("deliveryNumber")}
            value={deliveryNumber}
            onChange={(e) => onDeliveryNumberChange(e.target.value)}
            aria-invalid={!!errors.deliveryNumber}
            aria-describedby={errors.deliveryNumber ? "delivery-number-error" : undefined}
          />
          {errors.deliveryNumber && (
            <span id="delivery-number-error" role="alert" className="mt-1 block text-xs text-danger">
              {errors.deliveryNumber}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="delivery-date" className="mb-1.5 block text-sm font-bold">
            Dátum
          </label>
          <input
            id="delivery-date"
            type="date"
            className={inputClass("date")}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="quantity" className="mb-1.5 block text-sm font-bold">
            Platené (ks)
          </label>
          <input
            id="quantity"
            type="number"
            inputMode="numeric"
            className={inputClass("quantity")}
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
          />
          {errors.quantity && (
            <span id="quantity-error" role="alert" className="mt-1 block text-xs text-danger">
              {errors.quantity}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="free-quantity" className="mb-1.5 block text-sm font-bold">
            Grátis (ks)
          </label>
          <input
            id="free-quantity"
            type="number"
            inputMode="numeric"
            className={inputClass("freeQuantity")}
            value={freeQuantity}
            onChange={(e) => onFreeQuantityChange(Number(e.target.value))}
          />
        </div>
      </div>

      <label htmlFor="price-with-vat" className="mb-1.5 mt-2 block text-sm font-bold">
        Cena za kus s DPH
      </label>
      <input
        id="price-with-vat"
        type="number"
        inputMode="decimal"
        step="0.01"
        className={inputClass("priceWithVat")}
        value={priceWithVat}
        onChange={(e) => onPriceChange(Number(e.target.value))}
      />

      <label htmlFor="note" className="mb-1.5 mt-2 block text-sm font-bold">
        Poznámka
      </label>
      <input
        id="note"
        className={inputClass("note")}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
      />
    </div>
  );
}
