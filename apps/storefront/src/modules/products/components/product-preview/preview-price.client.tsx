"use client"

import { useSpotPrices } from "@lib/context/spot-price-context"
import { computeFinalPrice } from "@u11d/dynamic-pricing-plugin/utils/price-formula"
import { convertToLocale } from "@lib/util/money"
import type { VariantPricingData } from "@lib/data/variant-pricing"
import type { HttpTypes } from "@medusajs/types"

export default function PreviewPrice({
  variants,
  pricingData,
  initialPrice,
}: {
  variants: HttpTypes.StoreProductVariant[]
  pricingData: Record<string, VariantPricingData>
  initialPrice: number | null
}) {
  const { prices } = useSpotPrices()

  function computeCheapest(): number | null {
    let cheapest: number | null = null
    for (const v of variants) {
      const data = pricingData[v.id]
      if (!data) continue
      const spot = prices.find((s) => s.material === data.material)
      if (!spot) continue
      const p = computeFinalPrice({
        weight: data.weight_oz,
        spotPrice: spot.price,
        spreadFactor: data.spread_factor,
        spreadFixed: data.spread_fixed,
        premiumPercentage: data.premium_percentage,
        premiumFixed: data.premium_fixed,
      })
      if (cheapest === null || p < cheapest) cheapest = p
    }
    return cheapest
  }

  const displayPrice = prices.length > 0 ? computeCheapest() : initialPrice

  if (displayPrice === null) return null

  return (
    <span className="text-ui-fg-muted" data-testid="price">
      {convertToLocale({
        amount: displayPrice,
        currency_code: "USD",
      })}
    </span>
  )
}
