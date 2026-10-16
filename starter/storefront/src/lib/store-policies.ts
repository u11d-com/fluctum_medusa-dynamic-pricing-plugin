/**
 * Single source of truth for store policies. The human-readable policy pages
 * (returns, shipping, contact) and the JSON-LD structured data both read from
 * here, so the two can never drift apart.
 *
 * Shipping rates mirror the shipping options created by the backend seed
 * (`starter/backend/src/migration-scripts/initial-data-seed.ts`). Update both
 * when changing shipping prices.
 */

export const STORE_NAME = "Fluctum"

/**
 * This storefront is a public demo of the Fluctum dynamic pricing framework.
 * Shown on every policy page, in llms.txt and in structured data, so neither
 * people nor AI agents mistake it for a real shop.
 */
export const DEMO_NOTICE =
  "This is a demo store showcasing Fluctum, an open-source dynamic pricing framework for precious metals built on Medusa. Products are not for sale: payments run in test mode, no money is charged and no goods are shipped."

export const FRAMEWORK_URL = "https://fluctum.io"

export const BUILDER = { name: "u11d", url: "https://u11d.com" } as const

export const CONTACT_EMAIL = "hello@u11d.com"

export const RETURN_POLICY = {
  days: 30,
  /** schema.org ReturnMethodEnumeration */
  method: "https://schema.org/ReturnByMail",
  /** schema.org ReturnFeesEnumeration */
  fees: "https://schema.org/FreeReturn",
  /** schema.org MerchantReturnEnumeration */
  category: "https://schema.org/MerchantReturnFiniteReturnWindow",
} as const

export const SHIPPING_POLICY = {
  handlingDays: { min: 0, max: 1 },
  standard: { name: "Standard Shipping", transitDays: { min: 5, max: 7 } },
  express: { name: "Express Shipping", transitDays: { min: 1, max: 2 } },
} as const

type ShippingRates = { standard: number; express: number }

/** Flat shipping rates per region currency (uppercase ISO 4217). */
const SHIPPING_RATES: Record<string, ShippingRates> = {
  USD: { standard: 10, express: 25 },
  CAD: { standard: 15, express: 35 },
  MXN: { standard: 200, express: 400 },
  BRL: { standard: 50, express: 100 },
  ARS: { standard: 2000, express: 4000 },
  EUR: { standard: 10, express: 20 },
  GBP: { standard: 8, express: 15 },
  DKK: { standard: 70, express: 140 },
  SEK: { standard: 100, express: 200 },
  PLN: { standard: 40, express: 80 },
  CZK: { standard: 250, express: 500 },
  HUF: { standard: 3500, express: 7000 },
  RON: { standard: 45, express: 90 },
  NGN: { standard: 6000, express: 12000 },
  ZAR: { standard: 150, express: 300 },
  JPY: { standard: 1500, express: 3000 },
  KRW: { standard: 12000, express: 25000 },
  AED: { standard: 35, express: 70 },
  SAR: { standard: 40, express: 80 },
  QAR: { standard: 35, express: 70 },
  KWD: { standard: 3, express: 6 },
}

export function getShippingRates(currencyCode: string): ShippingRates | null {
  return SHIPPING_RATES[currencyCode.toUpperCase()] ?? null
}

export const POLICY_PAGES = [
  { path: "/returns", key: "returnPolicy" },
  { path: "/shipping", key: "shippingInformation" },
  { path: "/terms", key: "termsOfService" },
  { path: "/privacy", key: "privacyPolicy" },
  { path: "/contact", key: "contact" },
] as const
