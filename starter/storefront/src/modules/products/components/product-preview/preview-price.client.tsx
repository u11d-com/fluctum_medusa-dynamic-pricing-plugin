"use client"

import { useSpotPrices } from "@lib/context/spot-price-context"
import { useCart } from "@modules/cart/context/cart-context"
import { convertToLocale } from "@lib/util/money"
import type { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"
import { computeCheapestVariant } from "@lib/util/dynamic-pricing"
import type { VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"

export default function PreviewPrice({
  variants,
  pricingData,
  initialPrice,
}: {
  variants: HttpTypes.StoreProductVariant[]
  pricingData: Record<string, VariantPricingData>
  initialPrice: number | null
}) {
  const { prices, rates } = useSpotPrices()
  const { cart, regionCurrencyCode } = useCart()
  const cartCurrencyCode = (cart?.currency_code ?? regionCurrencyCode).toUpperCase()
  const isUsd = cartCurrencyCode === "USD"
  const conversionRate: number | null = isUsd ? 1 : (rates[cartCurrencyCode] ?? null)

  const liveResult = (prices.length > 0 && conversionRate !== null)
    ? computeCheapestVariant(variants, pricingData, prices, conversionRate)
    : null

  const displayPrice = liveResult?.price ?? (isUsd ? initialPrice : null)

  if (displayPrice === null) return null

  return (
    <Text as="span" variant="muted" data-testid="price">
      {convertToLocale({ amount: displayPrice, currency_code: cartCurrencyCode.toLowerCase() })}
    </Text>
  )
}
