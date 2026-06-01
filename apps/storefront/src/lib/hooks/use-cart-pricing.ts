"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { computeFinalPrice } from "@u11d/dynamic-pricing-plugin/utils/price-formula"
import { getVariantPricingData, type VariantPricingData } from "@lib/data/variant-pricing"

export type CartItemPrice = {
  unit_price: number
  total: number
}

export function useCartPricing(cart: HttpTypes.StoreCart | null): {
  itemPrices: Record<string, CartItemPrice>
  isLoading: boolean
  subtotal: number
} {
  const { prices, isLoading: spotLoading } = useSpotPrices()
  const [pricingData, setPricingData] = useState<Record<string, VariantPricingData>>({})
  const [pricingLoading, setPricingLoading] = useState(true)

  const variantIds = useMemo(() => {
    return (cart?.items ?? [])
      .map((item) => item.variant_id)
      .filter((id): id is string => !!id)
  }, [cart?.items])

  useEffect(() => {
    if (variantIds.length === 0) {
      setPricingData({})
      setPricingLoading(false)
      return
    }

    setPricingLoading(true)

    getVariantPricingData(variantIds)
      .then((data) => {
        setPricingData(data)
        setPricingLoading(false)
      })
      .catch(() => {
        setPricingLoading(false)
      })
  }, [variantIds])

  const itemPrices = useMemo(() => {
    const map: Record<string, CartItemPrice> = {}

    for (const item of cart?.items ?? []) {
      const variantId = item.variant_id
      if (!variantId) continue

      const data = pricingData[variantId]
      if (!data) continue

      const spot = prices.find((s) => s.material === data.material)
      if (!spot) continue

      const unitPrice = computeFinalPrice({
        weight: data.weight_oz,
        spotPrice: spot.price,
        spreadFactor: data.spread_factor,
        spreadFixed: data.spread_fixed,
        premiumPercentage: data.premium_percentage,
        premiumFixed: data.premium_fixed,
      })

      const total = Math.round(unitPrice * item.quantity * 100) / 100

      map[item.id] = {
        unit_price: unitPrice,
        total,
      }
    }

    return map
  }, [pricingData, prices, cart?.items])

  const subtotal = useMemo(() => {
    let total = 0
    for (const item of cart?.items ?? []) {
      const computed = itemPrices[item.id]
      if (computed) {
        total += computed.total
      }
    }
    return total
  }, [itemPrices, cart?.items])

  return {
    itemPrices,
    isLoading: spotLoading || pricingLoading,
    subtotal,
  }
}
