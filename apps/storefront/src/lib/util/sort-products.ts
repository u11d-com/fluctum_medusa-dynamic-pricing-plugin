import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Sort products by material (Gold before Silver), then alphabetically by title.
 * Material is inferred from the product handle (e.g. "american-gold-eagle" → Gold).
 */
export function sortByCategory(
  products: HttpTypes.StoreProduct[]
): HttpTypes.StoreProduct[] {
  return [...products].sort((a, b) => {
    const aHandle = a.handle ?? ""
    const bHandle = b.handle ?? ""
    const aMaterial = aHandle.includes("gold") ? 0 : 1
    const bMaterial = bHandle.includes("gold") ? 0 : 1
    if (aMaterial !== bMaterial) return aMaterial - bMaterial
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
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = products as MinPricedProduct[]

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
