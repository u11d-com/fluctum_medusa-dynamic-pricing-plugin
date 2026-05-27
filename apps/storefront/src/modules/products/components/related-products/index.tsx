import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { sortByCategory } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: HttpTypes.StoreProductListParams = { limit: 5 }
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return sortByCategory(
      response.products.filter(
        (responseProduct) => responseProduct.id !== product.id
      )
    ).slice(0, 4)
  })

  if (!products.length) {
    return null
  }

  const allVariantIds = products
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
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Related products
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} spotPrices={spotPrices} pricingData={pricingData} />
          </li>
        ))}
      </ul>
    </div>
  )
}
