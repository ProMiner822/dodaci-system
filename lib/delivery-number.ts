import { STORAGE_KEYS } from "./constants";

export function nextDeliveryNumber(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dateKey = `${y}${m}${d}`;

  const lastDate = localStorage.getItem(STORAGE_KEYS.lastDate);
  const lastCount = Number(
    localStorage.getItem(STORAGE_KEYS.lastCount) || "0",
  );

  const nextCount = lastDate === dateKey ? lastCount + 1 : 1;
  localStorage.setItem(STORAGE_KEYS.lastDate, dateKey);
  localStorage.setItem(STORAGE_KEYS.lastCount, String(nextCount));

  return `DL-${dateKey}-${String(nextCount).padStart(3, "0")}`;
}
