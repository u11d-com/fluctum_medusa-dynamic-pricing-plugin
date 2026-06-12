import { HttpTypes } from "@medusajs/types"
import type { SpotPricePayload, VariantPricingData } from "types/dynamic-pricing"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import { collectVariantIds, computeProductDynamicPrice, getProductDisplayTitle } from "@lib/util/dynamic-pricing"
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

  const cheapestPrice = computeProductDynamicPrice(product, pricingData, spotPrices)

  const firstVariantId = product.variants?.[0]?.id
  const displayTitle = getProductDisplayTitle(product)

  if (showAddToCart) {
    return (
      <ProductCard
        title={displayTitle}
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
          {firstVariantId && <AddToCartButton variantId={firstVariantId} />}
        </div>
      </ProductCard>
    )
  }

  return (
    <ProductCard
      title={displayTitle}
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
