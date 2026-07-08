"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import { Text } from "@modules/common/components/ui"
import { useLocale, useTranslations } from "next-intl"

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

const formatCountry = (locale: string, country?: string | null) => {
  if (!country) return "-"
  const normalized = country.trim().toUpperCase()
  return new Intl.DisplayNames(locale, { type: "region" }).of(normalized) ?? normalized
}

const formatDimensionPart = (value?: number | null, unit = "cm") => {
  if (value == null) return null
  return `${value} ${unit}`
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const locale = useLocale()
  const t = useTranslations('product')
  const length = formatDimensionPart(product.length)
  const width = formatDimensionPart(product.width)
  const height = formatDimensionPart(product.height)
  const dimensions = [length, width, height].filter(Boolean)

  return (
    <div className="text-small-regular pb-2">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">{t('material')}</span>
            <Text>{product.material ? product.material : "-"}</Text>
          </div>
          <div>
            <span className="font-semibold">{t('countryOfOrigin')}</span>
            <Text>{formatCountry(locale, product.origin_country)}</Text>
          </div>
          <div>
            <span className="font-semibold">{t('type')}</span>
            <Text>{product.type ? product.type.value : "-"}</Text>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">{t('weight')}</span>
            <Text>{product.weight ? `${product.weight} g` : "-"}</Text>
          </div>
          <div>
            <span className="font-semibold">{t('dimensions')}</span>
            <Text>{dimensions.length > 0 ? dimensions.join(" x ") : "-"}</Text>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  const t = useTranslations('product')
  return (
    <div className="text-small-regular pt-1 pb-2">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <Text as="span" className="font-semibold">{t('fastDelivery')}</Text>
            <Text className="max-w-sm">
              {t('fastDeliveryDesc')}
            </Text>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <Text as="span" className="font-semibold">{t('simpleExchanges')}</Text>
            <Text className="max-w-sm">
              {t('simpleExchangesDesc')}
            </Text>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <Text as="span" className="font-semibold">{t('easyReturns')}</Text>
            <Text className="max-w-sm">
              {t('easyReturnsDesc')}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
