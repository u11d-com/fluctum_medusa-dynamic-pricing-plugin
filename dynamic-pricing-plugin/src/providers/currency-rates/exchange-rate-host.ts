import type { CurrencyRateProviderFn } from "../../types"

/**
 * Currency rate provider using the free exchangerate.host public API.
 * No API key required. Suitable for production use with moderate rate limits.
 */
export const exchangeRateHostProvider: CurrencyRateProviderFn = async (
  from: string,
  to: string[]
) => {
  const symbols = to.join(",")
  const url = `https://api.exchangerate.host/latest?base=${from}&symbols=${symbols}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `[dynamic-pricing-plugin] exchangeRateHost: HTTP ${response.status} for ${url}`
    )
  }
  const data = (await response.json()) as { rates?: Record<string, number> }
  if (!data.rates) {
    throw new Error(
      `[dynamic-pricing-plugin] exchangeRateHost: unexpected response shape (no 'rates' key)`
    )
  }
  return Object.entries(data.rates).map(([code, rate]) => ({ to: code, rate }))
}
