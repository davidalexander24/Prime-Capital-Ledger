// Shared display formatting. Amounts follow their currency: USD reads
// $1,234.56 and IDR reads Rp1.234.567, wherever they appear.

const USD_AMOUNT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const IDR_AMOUNT = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const QUANTITY = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

export function formatMoney(
  value: number,
  currency: string,
  { signed = false }: { signed?: boolean } = {}
): string {
  const isIdr = currency === "IDR";
  const rounded = isIdr ? Math.round(value) : Math.round(value * 100) / 100;
  const amount = isIdr
    ? `Rp${IDR_AMOUNT.format(Math.abs(rounded))}`
    : `$${USD_AMOUNT.format(Math.abs(rounded))}`;
  if (rounded < 0) return `-${amount}`;
  return signed ? `+${amount}` : amount;
}

export function formatQuantity(value: number): string {
  return QUANTITY.format(value);
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();

function dateFormat(timeZone: string, withTime: boolean): Intl.DateTimeFormat {
  const key = `${timeZone}|${withTime}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
      timeZone,
    });
    dateFormats.set(key, format);
  }
  return format;
}

// Ledger dates are calendar dates stored as UTC midnight, so they format in
// UTC. Real timestamps (an import's createdAt, "now") pass the user's zone.
export function formatDate(value: string | Date, timeZone = "UTC"): string {
  return dateFormat(timeZone, false).format(new Date(value));
}

export function formatDateTime(value: string | Date, timeZone: string): string {
  return dateFormat(timeZone, true).format(new Date(value));
}

// Value for <input type="date">, taken from the device's local calendar day
// (toISOString would give yesterday before 07:00 in Jakarta).
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const AXIS_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const AXIS_MONTH = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

// Chart ticks: "Oct 9", or "Oct '25" on a scale of a year or more.
export function formatAxisDate(value: string, yearScale: boolean): string {
  const date = new Date(value);
  if (!yearScale) return AXIS_DAY.format(date);
  return `${AXIS_MONTH.format(date)} '${String(date.getUTCFullYear()).slice(2)}`;
}

// Values under 10,000 print in full ("9,500"), larger ones in K, M or B.
const AXIS_UNITS = [
  { from: 1e9, size: 1e9, suffix: "B" },
  { from: 1e6, size: 1e6, suffix: "M" },
  { from: 1e4, size: 1e3, suffix: "K" },
];

// Axis labels for a value range: one unit for every tick, and enough decimals
// that ticks like 2.5K or 50.305M keep their value instead of rounding into a
// neighbour ("1K, 1K, 2K"). Tight ranges get a third decimal.
export function axisValueFormatter(min: number, max: number): (value: number) => string {
  const magnitude = Math.max(Math.abs(min), Math.abs(max));
  const unit = AXIS_UNITS.find((u) => magnitude >= u.from);
  const size = unit?.size ?? 1;
  const step = (max - min) / 4 / size;
  const decimals = step > 0 ? Math.min(3, Math.max(2, Math.ceil(-Math.log10(step)))) : 2;
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals });
  return (value) => (value === 0 ? "0" : `${number.format(value / size)}${unit?.suffix ?? ""}`);
}
