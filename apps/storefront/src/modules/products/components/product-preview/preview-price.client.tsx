"use client"

import { useSpotPrices } from "@lib/context/spot-price-context"
import { convertToLocale } from "@lib/util/money"
import type { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"
import { computeCheapestVariant } from "@lib/util/dynamic-pricing"
import type { VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"

export default function PreviewPrice({
  variants,
  pricingData,
  initialPrice,
  initialVariantLabel,
}: {
  variants: HttpTypes.StoreProductVariant[]
  pricingData: Record<string, VariantPricingData>
  initialPrice: number | null
  initialVariantLabel?: string
}) {
  const { prices } = useSpotPrices()

  const liveResult = prices.length > 0
    ? computeCheapestVariant(variants, pricingData, prices)
    : null

  const displayPrice = liveResult?.price ?? initialPrice
  const variantLabel = liveResult?.variant.title ?? initialVariantLabel

  if (displayPrice === null) return null

  return (
    <Text as="span" variant="muted" data-testid="price">
      {convertToLocale({ amount: displayPrice, currency_code: "USD" })}
    </Text>
  )
}
