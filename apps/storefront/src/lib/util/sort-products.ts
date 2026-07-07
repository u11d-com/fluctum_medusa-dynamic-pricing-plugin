import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import type { SpotPricePayload, VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"
import { computeProductDynamicPrice } from "@lib/util/dynamic-pricing"

const MATERIAL_ORDER: Record<string, number> = {
  gold: 0,
  silver: 1,
  platinum: 2,
  palladium: 3,
}

function materialRank(handle: string): number {
  for (const [key, rank] of Object.entries(MATERIAL_ORDER)) {
    if (handle.includes(key)) {
      return rank
    }
  }

  return Number.MAX_SAFE_INTEGER
}

/**
 * Sort products by material (Gold before Silver), then alphabetically by title.
 * Material is inferred from the product handle (e.g. "american-gold-eagle" → Gold).
 */
export function sortByCategory(
  products: HttpTypes.StoreProduct[]
): HttpTypes.StoreProduct[] {
  return [...products].sort((a, b) => {
    const aMaterial = materialRank(a.handle ?? "")
    const bMaterial = materialRank(b.handle ?? "")

    if (aMaterial !== bMaterial) {
      return aMaterial - bMaterial
    }

    return (a.title ?? "").localeCompare(b.title ?? "")
  })
}

/**
 * Helper function to sort products — uses category sort by default.
 * @param products
 * @param sortBy
 * @returns products sorted by the given strategy
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions,
  pricingData?: Record<string, VariantPricingData>,
  spotPrices?: SpotPricePayload[]
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products]

  if (sortBy === "price_asc" && pricingData && spotPrices) {
    return sortedProducts.sort((a, b) => {
      const leftPrice =
        computeProductDynamicPrice(a, pricingData, spotPrices) ?? Number.POSITIVE_INFINITY
      const rightPrice =
        computeProductDynamicPrice(b, pricingData, spotPrices) ?? Number.POSITIVE_INFINITY

      return leftPrice - rightPrice
    })
  }

  if (sortBy === "price_desc" && pricingData && spotPrices) {
    return sortedProducts.sort((a, b) => {
      const leftPrice =
        computeProductDynamicPrice(a, pricingData, spotPrices) ?? Number.NEGATIVE_INFINITY
      const rightPrice =
        computeProductDynamicPrice(b, pricingData, spotPrices) ?? Number.NEGATIVE_INFINITY

      return rightPrice - leftPrice
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
    return sortedProducts
  }

  return sortByCategory(sortedProducts)
}
