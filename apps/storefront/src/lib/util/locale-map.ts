const COUNTRY_TO_LOCALE: Record<string, string> = {
  de: "de",
  at: "de",
  pl: "pl",
  es: "es",
  mx: "es",
  ar: "es",
}

export function getLocaleFromCountry(countryCode: string): string {
  return COUNTRY_TO_LOCALE[countryCode.toLowerCase()] ?? "en"
}
