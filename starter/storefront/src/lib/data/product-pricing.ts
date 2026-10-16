import "server-only"

import { HttpTypes } from "@medusajs/types"
import type {
  SpotPricePayload,
  VariantPricingData,
} from "@u11d/medusa-dynamic-pricing/client"
import {
  collectVariantIds,
  computeVariantDynamicPrice,
  indexSpotPricesByMaterial,
} from "@lib/util/dynamic-pricing"
import { listCurrencyRates, listSpotPrices } from "./spot-prices"
import { getVariantPricingData } from "./variant-pricing"

/**
 * Server-side snapshot of everything needed to compute a product's dynamic
 * prices. The product page seeds the client price display with it (so the SSR
 * HTML contains a real price) and builds structured data from the same values,
 * which guarantees the visible price and the JSON-LD price match.
 */
export type PricingSnapshot = {
  pricingData: Record<string, VariantPricingData>
  spotPrices: SpotPricePayload[]
  rates: Record<string, number>
}

export async function getPricingSnapshot(
  variants: HttpTypes.StoreProductVariant[] | null | undefined
): Promise<PricingSnapshot> {
  const variantIds = collectVariantIds(variants)

  const [pricingData, spotPrices, rates] = await Promise.all([
    variantIds.length > 0
      ? getVariantPricingData(variantIds)
      : Promise.resolve<Record<string, VariantPricingData>>({}),
    listSpotPrices().catch((): SpotPricePayload[] => []),
    listCurrencyRates().catch((): Record<string, number> => ({})),
  ])

  return { pricingData, spotPrices, rates }
}

/** Spot prices are quoted in USD; returns null when no rate is known yet. */
export function getConversionRate(
  rates: Record<string, number>,
  currencyCode: string
): number | null {
  const code = currencyCode.toUpperCase()
  return code === "USD" ? 1 : (rates[code] ?? null)
}

export function computeSnapshotVariantPrices(
  snapshot: PricingSnapshot,
  variants: HttpTypes.StoreProductVariant[],
  currencyCode: string
): Map<string, number> {
  const prices = new Map<string, number>()
  const rate = getConversionRate(snapshot.rates, currencyCode)

  if (rate === null) {
    return prices
  }

  const spotPriceByMaterial = indexSpotPricesByMaterial(snapshot.spotPrices)

  for (const variant of variants) {
    const price = computeVariantDynamicPrice(
      variant.id,
      snapshot.pricingData,
      spotPriceByMaterial,
      rate
    )

    if (price !== null) {
      prices.set(variant.id, price)
    }
  }

  return prices
}
