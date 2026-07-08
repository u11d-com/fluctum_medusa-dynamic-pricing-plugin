import type { CurrencyRateProviderFn } from "../../types"

/**
 * Creates a static currency rate provider from a pre-defined rates map.
 * rates is a Record<targetCurrencyCode, rate> where all rates are relative to a single source currency.
 * This provider ignores `from` and returns the static rates directly (they are already relative to `from`).
 */
export function createStaticRatesProvider(
  options: { rates: Record<string, number> }
): CurrencyRateProviderFn {
  return async (_from: string, to: string[]) => {
    return to
      .filter((code) => options.rates[code.toUpperCase()] !== undefined)
      .map((code) => ({
        to: code.toUpperCase(),
        rate: options.rates[code.toUpperCase()],
      }))
  }
}
