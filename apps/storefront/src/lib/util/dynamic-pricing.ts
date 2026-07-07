import { HttpTypes } from "@medusajs/types"
import type {
  LockedPriceMap,
  VariantPricingData,
  SpotPricePayload,
} from "@u11d/medusa-dynamic-pricing/client"
import { computeFinalPrice } from "@u11d/medusa-dynamic-pricing/client"

export function getProductDisplayTitle(product: HttpTypes.StoreProduct): string {
  if (product.variants?.length === 1 && product.variants[0]?.title) {
    return `${product.title} -- ${product.variants[0].title}`
  }

  return product.title ?? ""
}

export function collectVariantIds(
  variants: Array<{ id?: string | null }> | undefined | null
): string[] {
  return (variants ?? []).flatMap((variant) => (variant.id ? [variant.id] : []))
}

export function indexSpotPricesByMaterial(
  spotPrices: SpotPricePayload[]
): Map<string, number> {
  return new Map(spotPrices.map((spotPrice) => [spotPrice.material, spotPrice.price]))
}

export function computeVariantDynamicPrice(
  variantId: string,
  pricingData: Record<string, VariantPricingData>,
  spotPriceByMaterial: Map<string, number>
): number | null {
  const data = pricingData[variantId]

  if (!data) {
    return null
  }

  const spotPrice = spotPriceByMaterial.get(data.material)

  if (spotPrice === undefined) {
    return null
  }

  return computeFinalPrice({
    weight: data.weight_oz,
    spotPrice,
    spreadFactor: data.spread_factor,
    spreadFixed: data.spread_fixed,
    premiumPercentage: data.premium_percentage,
    premiumFixed: data.premium_fixed,
  })
}

export function computeCheapestVariantPrice(
  variants: HttpTypes.StoreProductVariant[],
  pricingData: Record<string, VariantPricingData>,
  spotPrices: SpotPricePayload[]
): number | null {
  const spotPriceByMaterial = indexSpotPricesByMaterial(spotPrices)
  let cheapest: number | null = null

  for (const variant of variants) {
    const price = computeVariantDynamicPrice(variant.id, pricingData, spotPriceByMaterial)

    if (price !== null && (cheapest === null || price < cheapest)) {
      cheapest = price
    }
  }

  return cheapest
}

export function computeCheapestVariant(
  variants: HttpTypes.StoreProductVariant[],
  pricingData: Record<string, VariantPricingData>,
  spotPrices: SpotPricePayload[]
): { variant: HttpTypes.StoreProductVariant; price: number } | null {
  const spotPriceByMaterial = indexSpotPricesByMaterial(spotPrices)
  let cheapest: { variant: HttpTypes.StoreProductVariant; price: number } | null = null

  for (const variant of variants) {
    if (!variant.id) continue
    const price = computeVariantDynamicPrice(variant.id, pricingData, spotPriceByMaterial)
    if (price !== null && (cheapest === null || price < cheapest.price)) {
      cheapest = { variant, price }
    }
  }

  return cheapest
}

export function computeProductDynamicPrice(
  product: HttpTypes.StoreProduct,
  pricingData: Record<string, VariantPricingData>,
  spotPrices: SpotPricePayload[]
): number | null {
  return computeCheapestVariantPrice(product.variants ?? [], pricingData, spotPrices)
}

type CartLikeItem = {
  id: string
  quantity: number
  variant_id?: string | null
}

export function computeCartItemDynamicPrice(
  item: CartLikeItem,
  pricingData: Record<string, VariantPricingData>,
  spotPrices: SpotPricePayload[]
): { unit_price: number; total: number } | null {
  if (!item.variant_id) {
    return null
  }

  const spotPriceByMaterial = indexSpotPricesByMaterial(spotPrices)
  const unitPrice = computeVariantDynamicPrice(item.variant_id, pricingData, spotPriceByMaterial)

  if (unitPrice === null) {
    return null
  }

  return {
    unit_price: unitPrice,
    total: Math.round(unitPrice * item.quantity * 100) / 100,
  }
}

export function buildLockedPriceMap(
  locks: { variant_id: string; unit_price: number; quantity: number }[],
  items: { id: string; variant_id?: string | null; quantity: number }[]
): LockedPriceMap {
  const variantPriceMap = new Map<string, number>()

  for (const lock of locks) {
    variantPriceMap.set(lock.variant_id, lock.unit_price)
  }

  const prices: LockedPriceMap = {}

  for (const item of items) {
    const unitPrice = item.variant_id ? variantPriceMap.get(item.variant_id) : undefined

    if (unitPrice !== undefined) {
      prices[item.id] = {
        unit_price: unitPrice,
        total: Math.round(unitPrice * item.quantity * 100) / 100,
      }
    }
  }

  return prices
}
