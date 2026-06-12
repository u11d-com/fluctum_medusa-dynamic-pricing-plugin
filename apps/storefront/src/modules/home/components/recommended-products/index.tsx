import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Text } from "@modules/common/components/ui"

export default async function RecommendedProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 4,
      fields: "*variants.calculated_price",
    },
  })

  if (!products?.length) {
    return null
  }

  return (
    <div className="relative overflow-hidden bg-black pt-16 small:pt-20 pb-16 small:pb-20">
      {/* Mask decorative background */}
      <div
        className="absolute inset-0 opacity-[0.18] bg-cover bg-center"
        style={{ backgroundImage: "url(/mask.svg)" }}
      />
      <div className="relative z-10 content-container px-6">
        <div className="mb-10">
          <Text className="text-4xl font-bold text-white tracking-tight">
            Recommended Products
          </Text>
        </div>
        <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-8 small:gap-y-10 items-stretch">
          {products.map((product) => (
            <li key={product.id} className="h-full">
              <ProductPreview
                product={product}
                region={region}
                isFeatured
                showAddToCart
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
