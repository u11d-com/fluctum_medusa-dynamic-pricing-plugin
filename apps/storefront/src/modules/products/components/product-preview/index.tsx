import { Text } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import type { SpotPricePayload } from "types/spot-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData, type VariantPricingData } from "@lib/data/variant-pricing"
import { computeFinalPrice } from "@lib/util/price-formula"
import { convertToLocale } from "@lib/util/money"
import PreviewPrice from "./preview-price.client"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
  spotPrices: prefetchedSpotPrices,
  pricingData: prefetchedPricingData,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  spotPrices?: SpotPricePayload[]
  pricingData?: Record<string, VariantPricingData>
}) {
  const [spotPrices, pricingData] = prefetchedSpotPrices && prefetchedPricingData
    ? [prefetchedSpotPrices, prefetchedPricingData]
    : await Promise.all([
        listSpotPrices().catch(() => []),
        getVariantPricingData(
          (product.variants ?? []).map((v) => v.id).filter(Boolean) as string[]
        ).catch(() => ({})),
      ])

  let cheapestPrice: number | null = null

  for (const variant of product.variants ?? []) {
    const data = pricingData[variant.id]
    if (!data) continue

    const spot = spotPrices.find((s) => s.material === data.material)
    if (!spot) continue

    const price = computeFinalPrice({
      weight: data.weight_oz,
      spotPrice: spot.price,
      spreadFactor: data.spread_factor,
      spreadFixed: data.spread_fixed,
      premiumPercentage: data.premium_percentage,
      premiumFixed: data.premium_fixed,
    })

    if (cheapestPrice === null || price < cheapestPrice) {
      cheapestPrice = price
    }
  }

  const displayTitle =
    product.variants?.length === 1 && product.variants[0]?.title
      ? `${product.title} — ${product.variants[0].title}`
      : product.title

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="flex txt-compact-medium mt-4 justify-between">
          <Text className="text-ui-fg-subtle" data-testid="product-title">
            {displayTitle}
          </Text>
          <div className="flex items-center gap-x-2">
            <PreviewPrice
              variants={product.variants ?? []}
              pricingData={pricingData}
              initialPrice={cheapestPrice}
            />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
