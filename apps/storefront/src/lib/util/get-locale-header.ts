import { getLocale } from "next-intl/server"

export async function getLocaleHeader() {
  const locale = await getLocale()
  return {
    "x-medusa-locale": locale,
  } as const
}
