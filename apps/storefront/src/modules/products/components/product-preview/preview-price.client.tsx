"use client"

import { useSpotPrices } from "@lib/context/spot-price-context"
import { convertToLocale } from "@lib/util/money"
import type { HttpTypes } from "@medusajs/types"
import { computeCheapestVariantPrice } from "@lib/util/dynamic-pricing"
import type { VariantPricingData } from "types/dynamic-pricing"

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

  const displayPrice =
    prices.length > 0
      ? computeCheapestVariantPrice(variants, pricingData, prices)
      : initialPrice

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
