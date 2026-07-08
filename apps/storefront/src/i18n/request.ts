import { getRequestConfig } from "next-intl/server"
import { headers } from "next/headers"

const SUPPORTED_LOCALES = ["en", "pl", "es", "de"] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export default getRequestConfig(async () => {
  const headersList = await headers()
  const raw = headersList.get("x-locale")
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : "en"

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "UTC",
  }
})
