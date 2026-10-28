type ClassValue = string | false | null | undefined;

/** Menggabungkan class name, mengabaikan nilai kosong. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(amount: number): string {
  return rupiah.format(amount);
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatDate(value: string | Date): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateTime.format(date);
}

/** Meloloskan karakter khusus regex agar pencarian pengguna diperlakukan sebagai teks biasa. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
