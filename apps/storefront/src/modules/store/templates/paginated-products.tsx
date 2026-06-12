import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import SortedProductGrid from "@modules/store/components/sorted-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { collectVariantIds, computeProductDynamicPrice } from "@lib/util/dynamic-pricing"
import type { SpotPricePayload, VariantPricingData } from "types/dynamic-pricing"

export default async function PaginatedProducts({
  sortBy,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: number // kept for API compatibility; unused (all products fetched at once)
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  const queryParams: {
    limit: number
    collection_id?: string[]
    category_id?: string[]
    id?: string[]
  } = { limit: 100 }

  if (collectionId) queryParams.collection_id = [collectionId]
  if (categoryId) queryParams.category_id = [categoryId]
  if (productsIds) queryParams.id = productsIds

  const region = await getRegion(countryCode)
  if (!region) return null

  const {
    response: { products },
  } = await listProductsWithSort({
    page: 1,
    queryParams,
    sortBy,
    countryCode,
  })

  const allVariantIds = collectVariantIds(products.flatMap((product) => product.variants ?? []))

  const emptyPricingData: Record<string, VariantPricingData> = {}
  const [spotPrices, pricingData] = await Promise.all([
    listSpotPrices().catch((): SpotPricePayload[] => []),
    allVariantIds.length > 0
      ? getVariantPricingData(allVariantIds).catch((): Record<string, VariantPricingData> => ({}))
      : Promise.resolve(emptyPricingData),
  ])

  // Compute server-side initial prices for immediate SSR display (before SSE connects)
  const initialPrices: Record<string, number | null> = {}
  for (const product of products) {
    initialPrices[product.id] = computeProductDynamicPrice(product, pricingData, spotPrices)
  }

  return (
    <SortedProductGrid
      products={products}
      pricingData={pricingData}
      sortBy={sortBy ?? "category"}
      initialPrices={initialPrices}
    />
  )
}
