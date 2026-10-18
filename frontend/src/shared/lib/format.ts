export const money = (value: unknown) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
export function display(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
export function statusClass(value: unknown) {
  const v = String(value).toUpperCase();
  return ["PAID", "ACTIVE", "AVAILABLE", "COMPLETED", "RESOLVED"].includes(v)
    ? "success"
    : ["FAILED", "REJECTED", "CANCELLED", "OVERDUE", "NO_SHOW"].includes(v)
      ? "danger"
      : "pending";
}
