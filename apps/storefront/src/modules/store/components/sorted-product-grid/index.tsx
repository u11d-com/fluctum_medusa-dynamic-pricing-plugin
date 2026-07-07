"use client"

import { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { useSpotPrices } from "@lib/context/spot-price-context"
import type { VariantPricingData } from "@u11d/medusa-dynamic-pricing/client"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PreviewPrice from "@modules/products/components/product-preview/preview-price.client"
import ProductCard from "@modules/products/components/product-card"
import { getProductDisplayTitle } from "@lib/util/dynamic-pricing"
import { sortProducts } from "@lib/util/sort-products"
import { Text } from "@modules/common/components/ui"

// ── Product card ─────────────────────────────────────────────────────────────

type StoreProductCardProps = {
  product: HttpTypes.StoreProduct
  pricingData: Record<string, VariantPricingData>
  initialPrice: number | null
}

function StoreProductCard({
  product,
  pricingData,
  initialPrice,
}: StoreProductCardProps) {
  const displayTitle = getProductDisplayTitle(product)

  return (
    <ProductCard
      title={displayTitle}
      href={`/products/${product.handle}`}
      imageThumbnail={product.thumbnail}
      images={product.images}
    >
      <div className="mt-auto pt-2">
        <PreviewPrice
          variants={product.variants ?? []}
          pricingData={pricingData}
          initialPrice={initialPrice}
        />
      </div>
    </ProductCard>
  )
}

// ── Grid ─────────────────────────────────────────────────────────────────────

type Props = {
  products: HttpTypes.StoreProduct[]
  pricingData: Record<string, VariantPricingData>
  sortBy: SortOptions
  initialPrices: Record<string, number | null>
}

export default function SortedProductGrid({ products, pricingData, sortBy, initialPrices }: Props) {
  const { prices: spotPrices } = useSpotPrices()

  const sorted = useMemo(
    () => sortProducts(products, sortBy, pricingData, spotPrices),
    [products, pricingData, spotPrices, sortBy]
  )

  if (sorted.length === 0) {
    return (
      <Text className="py-8">No products found.</Text>
    )
  }

  return (
    <ul
      className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
      data-testid="products-list"
    >
      {sorted.map((p) => (
        <li key={p.id}>
          <StoreProductCard
            product={p}
            pricingData={pricingData}
            initialPrice={initialPrices[p.id] ?? null}
          />
        </li>
      ))}
    </ul>
  )
}
