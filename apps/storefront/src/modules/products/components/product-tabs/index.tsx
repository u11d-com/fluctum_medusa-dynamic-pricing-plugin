"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import { Text } from "@modules/common/components/ui"

import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  return (
    <div className="w-full">
      <div className="py-2">
        <ProductInfoTab product={product} />
      </div>
      <div className="py-2">
        <ShippingInfoTab />
      </div>
    </div>
  )
}

const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  gb: "United Kingdom",
  de: "Germany",
  pl: "Poland",
}

const formatCountry = (country?: string | null) => {
  if (!country) return "-"
  const normalized = country.trim().toLowerCase()
  return COUNTRY_NAMES[normalized] ?? normalized.toUpperCase()
}

const formatDimensionPart = (value?: number | null, unit = "cm") => {
  if (value == null) return null
  return `${value} ${unit}`
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const length = formatDimensionPart(product.length)
  const width = formatDimensionPart(product.width)
  const height = formatDimensionPart(product.height)
  const dimensions = [length, width, height].filter(Boolean)

  return (
    <div className="text-small-regular pb-2">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Material</span>
            <Text>{product.material ? product.material : "-"}</Text>
          </div>
          <div>
            <span className="font-semibold">Country of origin</span>
            <Text>{formatCountry(product.origin_country)}</Text>
          </div>
          <div>
            <span className="font-semibold">Type</span>
            <Text>{product.type ? product.type.value : "-"}</Text>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Weight</span>
            <Text>{product.weight ? `${product.weight} g` : "-"}</Text>
          </div>
          <div>
            <span className="font-semibold">Dimensions</span>
            <Text>{dimensions.length > 0 ? dimensions.join(" x ") : "-"}</Text>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular pt-1 pb-2">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <Text as="span" className="font-semibold">Fast delivery</Text>
            <Text className="max-w-sm">
              Your package will arrive in 3-5 business days at your pick up
              location or in the comfort of your home.
            </Text>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <Text as="span" className="font-semibold">Simple exchanges</Text>
            <Text className="max-w-sm">
              Is the fit not quite right? No worries - we&apos;ll exchange your
              product for a new one.
            </Text>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <Text as="span" className="font-semibold">Easy returns</Text>
            <Text className="max-w-sm">
              Just return your product and we&apos;ll refund your money. No
              questions asked – we&apos;ll do our best to make sure your return
              is hassle-free.
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
