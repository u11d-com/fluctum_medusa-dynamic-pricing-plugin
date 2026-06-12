import { listProducts } from "@lib/data/products"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { sortByCategory } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  const sortedProducts = sortByCategory(pricedProducts)

  const allVariantIds = sortedProducts
    .flatMap((p) => p.variants ?? [])
    .map((v) => v.id)
    .filter(Boolean) as string[]

  const [spotPrices, pricingData] = await Promise.all([
    listSpotPrices().catch(() => []),
    allVariantIds.length > 0
      ? getVariantPricingData(allVariantIds).catch(() => ({}))
      : Promise.resolve({}),
  ])

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex justify-between mb-8">
        <Text className="txt-xlarge">{collection.title}</Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36">
        {sortedProducts.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} isFeatured showAddToCart spotPrices={spotPrices} pricingData={pricingData} />
          </li>
        ))}
      </ul>
    </div>
  )
}
