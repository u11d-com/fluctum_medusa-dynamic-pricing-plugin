"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { useCart } from "@modules/cart/context/cart-context"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { convertToLocale } from "@lib/util/money"
import {
  collectVariantIds,
  computeProductDynamicPrice,
  computeVariantDynamicPrice,
  indexSpotPricesByMaterial,
} from "@lib/util/dynamic-pricing"
import { Text } from "@modules/common/components/ui"
import type { VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"
import { useTranslations } from "next-intl"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { prices, rates, isLoading: spotLoading } = useSpotPrices()
  const { cart, regionCurrencyCode } = useCart()
  const cartCurrencyCode = (
    cart?.currency_code ?? regionCurrencyCode
  ).toUpperCase()
  const isUsd = cartCurrencyCode === "USD"
  const conversionRate: number | null = isUsd
    ? 1
    : (rates[cartCurrencyCode] ?? null)
  const [pricingData, setPricingData] = useState<
    Record<string, VariantPricingData>
  >({})
  const [pricingLoading, setPricingLoading] = useState(true)
  const t = useTranslations("product")

  useEffect(() => {
    let cancelled = false
    const variantIds = collectVariantIds(product.variants)

    if (variantIds.length === 0) {
      setPricingLoading(false)
      return
    }

    getVariantPricingData(variantIds)
      .then((data) => {
        if (cancelled) {
          return
        }

        setPricingData(data)
        setPricingLoading(false)
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setPricingLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [product.variants])

  const spotPriceByMaterial = indexSpotPricesByMaterial(prices)

  if (spotLoading || pricingLoading || conversionRate === null) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  function computePrice(
    v: HttpTypes.StoreProductVariant,
    rate: number,
  ): number | null {
    return computeVariantDynamicPrice(
      v.id,
      pricingData,
      spotPriceByMaterial,
      rate,
    )
  }

  const displayPrice = variant
    ? computePrice(variant, conversionRate)
    : computeProductDynamicPrice(product, pricingData, prices, conversionRate)

  if (displayPrice === null && prices.length === 0) {
    return null
  }

  if (displayPrice === null) {
    return (
      <div className="flex flex-col">
        <Text as="span" variant="muted" data-testid="product-price-unavailable">
          {t("priceUnavailable")}
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Text as="span" className="text-xl-semi">
        {!variant && t("from") + " "}
        <Text
          as="span"
          key={displayPrice}
          className="inline-block animate-price-pulse"
          data-testid="product-price"
          data-value={displayPrice}
        >
          {convertToLocale({
            amount: displayPrice,
            currency_code: cartCurrencyCode.toLowerCase(),
          })}
        </Text>
      </Text>
    </div>
  )
}
