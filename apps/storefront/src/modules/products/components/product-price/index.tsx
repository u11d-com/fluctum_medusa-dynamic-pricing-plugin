"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { convertToLocale } from "@lib/util/money"
import {
  collectVariantIds,
  computeProductDynamicPrice,
  computeVariantDynamicPrice,
  indexSpotPricesByMaterial,
} from "@lib/util/dynamic-pricing"
import type { VariantPricingData } from "types/dynamic-pricing"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { prices, isLoading: spotLoading } = useSpotPrices()
  const [pricingData, setPricingData] = useState<Record<string, VariantPricingData>>({})
  const [pricingLoading, setPricingLoading] = useState(true)

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

  function computePrice(v: HttpTypes.StoreProductVariant): number | null {
    return computeVariantDynamicPrice(v.id, pricingData, spotPriceByMaterial)
  }

  const ready = !spotLoading && !pricingLoading

  if (!ready) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const displayPrice = variant
    ? computePrice(variant)
    : computeProductDynamicPrice(product, pricingData, prices)

  if (displayPrice === null && prices.length === 0) {
    return null
  }

  if (displayPrice === null) {
    return (
      <div className="flex flex-col text-ui-fg-base">
        <span className="text-sm text-ui-fg-muted" data-testid="product-price-unavailable">
          Price unavailable
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span className="text-xl-semi">
        {!variant && "From "}
        <span data-testid="product-price" data-value={displayPrice}>
          {convertToLocale({ amount: displayPrice, currency_code: "USD" })}
        </span>
      </span>
    </div>
  )
}
