import type { HttpTypes } from "@medusajs/types"
import type { SpotPricePayload, VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { collectVariantIds, computeCheapestVariant, getProductDisplayTitle } from "@lib/util/dynamic-pricing"
import PreviewPrice from "./preview-price.client"
import AddToCartButton from "../add-to-cart-button"
import ProductCard from "../product-card"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
  spotPrices: prefetchedSpotPrices,
  pricingData: prefetchedPricingData,
  showAddToCart,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  spotPrices?: SpotPricePayload[]
  pricingData?: Record<string, VariantPricingData>
  showAddToCart?: boolean
}) {
  const [spotPrices, pricingData] = prefetchedSpotPrices && prefetchedPricingData
    ? [prefetchedSpotPrices, prefetchedPricingData]
    : await Promise.all([
        listSpotPrices().catch((): SpotPricePayload[] => []),
        getVariantPricingData(collectVariantIds(product.variants)).catch(
          (): Record<string, VariantPricingData> => ({})
        ),
      ])

  const cheapestVariant = computeCheapestVariant(product.variants ?? [], pricingData, spotPrices)
  const cheapestPrice = cheapestVariant?.price ?? null
  const cheapestVariantId = cheapestVariant?.variant.id ?? product.variants?.[0]?.id
  const cheapestVariantTitle = cheapestVariant?.variant.title ?? undefined

  const displayTitle = getProductDisplayTitle(product)

  if (showAddToCart) {
    return (
      <ProductCard
        title={displayTitle}
        variantLabel={cheapestVariantTitle}
        href={`/products/${product.handle}`}
        imageThumbnail={product.thumbnail}
        images={product.images}
        isFeatured={isFeatured}
        withTranslateY={false}
      >
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <PreviewPrice
            variants={product.variants ?? []}
            pricingData={pricingData}
            initialPrice={cheapestPrice}
          />
          {cheapestVariantId && <AddToCartButton variantId={cheapestVariantId} />}
        </div>
      </ProductCard>
    )
  }

  return (
    <ProductCard
      title={displayTitle}
      variantLabel={cheapestVariantTitle}
      href={`/products/${product.handle}`}
      imageThumbnail={product.thumbnail}
      images={product.images}
      isFeatured={isFeatured}
    >
      <div className="mt-auto pt-2">
        <PreviewPrice
          variants={product.variants ?? []}
          pricingData={pricingData}
          initialPrice={cheapestPrice}
        />
      </div>
    </ProductCard>
  )
}
