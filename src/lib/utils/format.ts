export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function inchesToFeetDisplay(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  if (remainingInches === 0) return `${feet}'`;
  return `${feet}' ${remainingInches}"`;
}
