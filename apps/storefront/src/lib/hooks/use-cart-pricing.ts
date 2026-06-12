"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { useSpotPrices } from "@lib/context/spot-price-context"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { collectVariantIds, computeCartItemDynamicPrice } from "@lib/util/dynamic-pricing"
import type { CartItemPrice, VariantPricingData } from "@u11d/dynamic-pricing-plugin/client"

export function useCartPricing(cart: HttpTypes.StoreCart | null): {
  itemPrices: Record<string, CartItemPrice>
  isLoading: boolean
  subtotal: number
} {
  const { prices, isLoading: spotLoading } = useSpotPrices()
  const [pricingData, setPricingData] = useState<Record<string, VariantPricingData>>({})
  const [pricingLoading, setPricingLoading] = useState(true)

  const variantIds = useMemo(() => {
    return collectVariantIds((cart?.items ?? []).map((item) => ({ id: item.variant_id })))
  }, [cart?.items])

  useEffect(() => {
    let cancelled = false

    if (variantIds.length === 0) {
      setPricingData({})
      setPricingLoading(false)
      return
    }

    setPricingLoading(true)

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
  }, [variantIds])

  const itemPrices = useMemo(() => {
    const map: Record<string, CartItemPrice> = {}

    for (const item of cart?.items ?? []) {
      const computed = computeCartItemDynamicPrice(item, pricingData, prices)

      if (computed) {
        map[item.id] = computed
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
