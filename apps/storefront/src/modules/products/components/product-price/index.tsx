"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { computeFinalPrice } from "@u11d/dynamic-pricing-plugin/utils/price-formula"
import { getVariantPricingData, type VariantPricingData } from "@lib/data/variant-pricing"
import { convertToLocale } from "@lib/util/money"

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
    const variantIds = (product.variants ?? []).map((v) => v.id).filter(Boolean) as string[]
    console.log("[ProductPrice] variants on product:", product.variants?.length, "resolved IDs:", variantIds)

    if (variantIds.length === 0) {
      console.log("[ProductPrice] no variant IDs, skipping pricing fetch")
      setPricingLoading(false)
      return
    }

    getVariantPricingData(variantIds)
      .then((data) => {
        console.log("[ProductPrice] variant pricing data received, keys:", Object.keys(data))
        setPricingData(data)
        setPricingLoading(false)
      })
      .catch((err) => {
        console.log("[ProductPrice] variant pricing fetch failed:", err)
        setPricingLoading(false)
      })
  }, [product.variants])

  console.log("[ProductPrice] render — spotLoading:", spotLoading, "pricingLoading:", pricingLoading, "prices:", prices.length, "pricingData keys:", Object.keys(pricingData))

  function computePrice(v: HttpTypes.StoreProductVariant): number | null {
    const data = pricingData[v.id]
    if (!data) {
      console.log("[ProductPrice] no pricing data for variant", v.id, "title:", v.title)
      return null
    }

    const spot = prices.find((s) => s.material === data.material)
    if (!spot) {
      console.log("[ProductPrice] no spot price for material", data.material, "variant:", v.title)
      return null
    }

    const computed = computeFinalPrice({
      weight: data.weight_oz,
      spotPrice: spot.price,
      spreadFactor: data.spread_factor,
      spreadFixed: data.spread_fixed,
      premiumPercentage: data.premium_percentage,
      premiumFixed: data.premium_fixed,
    })
    console.log("[ProductPrice] computed price for", v.title, ":", computed)
    return computed
  }

  function findCheapest(): number | null {
    if (!product.variants) return null
    let cheapest: number | null = null
    for (const v of product.variants) {
      const p = computePrice(v)
      if (p !== null && (cheapest === null || p < cheapest)) {
        cheapest = p
      }
    }
    return cheapest
  }

  const ready = !spotLoading && !pricingLoading

  if (!ready) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const displayPrice = variant ? computePrice(variant) : findCheapest()

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
