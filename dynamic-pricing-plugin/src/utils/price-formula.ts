/**
 * Computes the final dynamic price for a product variant.
 *
 * Formula:
 *   final = weight × spot_price × spread_factor × (1 + premium_percentage / 100)
 *           + spread_fixed + premium_fixed
 *
 * All monetary values are stored as-is (not in cents).
 * Weight is in troy ounces.
 */
export type PricingFactors = {
  /** Weight of the variant in troy ounces */
  weight: number
  /** Current spot price of the material (e.g. XAU price in USD) */
  spotPrice: number
  /** Multiplicative spread factor (default 1) */
  spreadFactor: number
  /** Fixed additive spread (default 0) */
  spreadFixed: number
  /** Premium as a percentage of the spot-adjusted price (default 0) */
  premiumPercentage: number
  /** Fixed additive premium (default 0) */
  premiumFixed: number
  /** Currency conversion rate (default 1) */
  currencyConversion?: number
}

export function computeFinalPrice(factors: PricingFactors): number {
  const {
    weight,
    spotPrice,
    spreadFactor,
    spreadFixed,
    premiumPercentage,
    premiumFixed,
    currencyConversion = 1,
  } = factors

  const base = weight * spotPrice * spreadFactor * currencyConversion
  const withPremiumPct = base * (1 + premiumPercentage / 100)
  const raw = withPremiumPct + spreadFixed + premiumFixed
  return Math.round(raw * 100) / 100
}
