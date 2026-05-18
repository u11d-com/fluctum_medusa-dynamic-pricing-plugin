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
 * Plugin configuration options passed in medusa-config.ts.
 */
export type DynamicPricingOptions = {
  /**
   * Array of material symbols to track, e.g. ["XAU", "XAG"].
   * At least one material is required.
   */
  materials: string[]

  /**
   * How often (in seconds) to fetch new spot prices.
   * @default 10
   */
  fetchIntervalSeconds?: number

  /**
   * The price provider function used to fetch spot prices.
   * Use built-in providers (randomProvider, goldApiProvider) or supply your own.
   */
  provider: PriceProviderFn

  /**
   * How long (in seconds) cart prices are locked once a user enters checkout.
   * @default 120
   */
  priceLockDurationSeconds?: number
}

/**
 * Resolved plugin options with all defaults applied.
 */
export type ResolvedDynamicPricingOptions = Required<DynamicPricingOptions>
