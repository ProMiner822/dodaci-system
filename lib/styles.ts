export const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 py-3 text-base transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function inputClass(error?: string): string {
  return `w-full min-h-[44px] rounded-lg border bg-surface px-3 py-3 text-base transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
    error ? "border-danger" : "border-border"
  }`;
}
