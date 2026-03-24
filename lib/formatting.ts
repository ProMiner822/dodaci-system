export function formatEUR(value: number): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

export function formatNum(value: number): string {
  return new Intl.NumberFormat("sk-SK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDateSK(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("sk-SK").format(d);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
