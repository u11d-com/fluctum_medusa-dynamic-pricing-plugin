type RouteParams = Readonly<Record<string, string | string[] | undefined>>

export function getCountryCodeFromParams(params: RouteParams): string | null {
  const countryCode = params.countryCode

  if (typeof countryCode === "string" && countryCode.length > 0) {
    return countryCode
  }

  return null
}
