import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_LOCALE: Record<string, string> = {
  INR: "en-IN", USD: "en-US", EUR: "de-DE", GBP: "en-GB",
  CAD: "en-CA", AUD: "en-AU", SGD: "en-SG", AED: "ar-AE",
  JPY: "ja-JP", CHF: "de-CH", MYR: "ms-MY", THB: "th-TH",
}

export function formatCurrency(amount: string | number | null | undefined, currency = "INR"): string {
  const num = parseFloat(String(amount ?? 0))
  const locale = CURRENCY_LOCALE[currency] ?? "en-IN"
  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return fmt.format(isNaN(num) ? 0 : num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "MMMM d, yyyy")
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "MMM d, yyyy")
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateSlug(partner1: string, partner2: string): string {
  const p1 = partner1.split(" ")[0].toLowerCase()
  const p2 = partner2.split(" ")[0].toLowerCase()
  const random = Math.random().toString(36).substring(2, 6)
  return `${p1}-and-${p2}-${random}`
}

export function parseAmount(val: string | null | undefined): number {
  return parseFloat(val ?? "0") || 0
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}
