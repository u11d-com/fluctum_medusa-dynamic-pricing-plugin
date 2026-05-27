export type PricingFactors = {
  weight: number
  spotPrice: number
  spreadFactor: number
  spreadFixed: number
  premiumPercentage: number
  premiumFixed: number
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
  return withPremiumPct + spreadFixed + premiumFixed
}
