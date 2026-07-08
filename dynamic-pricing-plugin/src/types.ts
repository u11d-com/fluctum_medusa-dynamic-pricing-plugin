/**
 * A single spot price result returned by a price provider.
 */
export type SpotPriceResult = {
  /** Material symbol, e.g. "XAU", "XAG" */
  material: string
  /** Ask price (sell price offered by the market) */
  ask: number
  /** Bid price (buy price offered by the market) */
  bid: number
  /** Mid/current price — typically (ask + bid) / 2 */
  price: number
}

/**
 * A price provider function. Receives the list of materials to fetch and
 * returns spot prices for each. Integrators can supply their own implementation.
 */
export type PriceProviderFn = (
  materials: string[]
) => Promise<SpotPriceResult[]>

/**
 * A currency rate provider function. Receives the source currency and a list of
 * target currencies, returns the conversion rate for each.
 */
export type CurrencyRateProviderFn = (
  from: string,
  to: string[]
) => Promise<Array<{ to: string; rate: number }>>

/**
 * Plugin configuration options passed in medusa-config.ts.
 */
export type DynamicPricingOptions = {
  /**
   * Array of material symbols to track, e.g. ["XAU", "XAG"].
   * At least one material is required.
   */
  materials: string[]

  /**
   * How often (in seconds) the SSE endpoint pushes updated prices to clients.
   * Also used as the DB write interval reference — note that Medusa's minimum
   * cron resolution is 1 minute, so the actual DB write rate is once per minute
   * regardless of this value.
   * Must be between 1 and 3600.
   * @default 10
   */
  fetchIntervalSeconds?: number

  /**
   * The price provider function used to fetch spot prices.
   * Use built-in providers (randomProvider, goldApiProvider) or supply your own.
   */
  provider: PriceProviderFn

  /**
   * The ISO-4217 currency code in which spot prices are provided by the price provider.
   * All dynamic prices are first computed in this currency, then converted to the
   * region currency using the currencyConversion rates.
   * @default "USD"
   */
  pricingCurrency?: string

  /**
   * Optional currency conversion configuration. When provided, the plugin will
   * maintain a CurrencyRate table and apply conversion factors during price locking.
   * If omitted, currencyConversion defaults to 1 (no conversion) for backward compat.
   */
  currencyConversion?: {
    /** Provider function that returns rates from pricingCurrency to each target currency */
    provider: CurrencyRateProviderFn
    /** How often (seconds) to refresh rates. @default 3600 */
    refreshIntervalSeconds?: number
    /** List of target currency codes (ISO-4217 uppercase) to maintain rates for */
    targetCurrencies: string[]
  }

  /**
   * How long (in seconds) cart prices are locked once a user enters checkout.
   * @default 120
   */
  priceLockDurationSeconds?: number
}

/**
 * Resolved plugin options with all defaults applied.
 */
export type ResolvedDynamicPricingOptions = {
  materials: string[]
  fetchIntervalSeconds: number
  provider: PriceProviderFn
  pricingCurrency: string
  currencyConversion:
    | {
        provider: CurrencyRateProviderFn
        refreshIntervalSeconds: number
        targetCurrencies: string[]
      }
    | null
  priceLockDurationSeconds: number
}
