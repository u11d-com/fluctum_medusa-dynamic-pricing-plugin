import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductInfo from "@modules/products/templates/product-info"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import RecommendedProducts from "@modules/home/components/recommended-products"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-ui-bg-subtle min-h-screen">
      <div
        className="content-container grid grid-cols-1 small:grid-cols-[1fr_380px] gap-x-12 py-12"
        data-testid="product-container"
      >
        {/* Left — image gallery */}
        <div className="w-full">
          <ImageGallery images={images} />
        </div>

        {/* Right — info first, then actions */}
        <div className="flex flex-col small:sticky small:top-24 small:self-start gap-y-6 py-4 small:py-0">
          <ProductInfo product={product} />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>

          {/* Tabs below the add-to-cart section */}
          <div className="pt-2">
            <ProductTabs product={product} />
          </div>
        </div>
      </div>

      <RecommendedProducts countryCode={countryCode} />
    </div>
  )
}

export default ProductTemplate
