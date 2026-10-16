import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import type {
  SpotPricePayload,
  VariantPricingData,
} from "@u11d/medusa-dynamic-pricing/client"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listSpotPrices } from "@lib/data/spot-prices"
import { getVariantPricingData } from "@lib/data/variant-pricing"
import {
  collectVariantIds,
  computeProductDynamicPrice,
} from "@lib/util/dynamic-pricing"
import { Heading, Text } from "@modules/common/components/ui"
import SortedProductGrid from "@modules/store/components/sorted-product-grid"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

const SEARCH_LIMIT = 48

function readQuery(q: string | string[] | undefined): string {
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? ""
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const query = readQuery((await props.searchParams).q)
  const t = await getTranslations("search")

  return {
    title: query ? `${t("resultsFor", { query })} | Fluctum` : t("title"),
    alternates: { canonical: `/${countryCode}/search` },
  }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const query = readQuery((await props.searchParams).q)
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const t = await getTranslations("search")

  const products = query
    ? await listProducts({
        countryCode,
        queryParams: { q: query, limit: SEARCH_LIMIT },
      }).then(({ response }) => response.products)
    : []

  const variantIds = collectVariantIds(
    products.flatMap((product) => product.variants ?? [])
  )
  const [spotPrices, pricingData] = await Promise.all([
    products.length > 0
      ? listSpotPrices().catch((): SpotPricePayload[] => [])
      : Promise.resolve<SpotPricePayload[]>([]),
    variantIds.length > 0
      ? getVariantPricingData(variantIds).catch(
          (): Record<string, VariantPricingData> => ({})
        )
      : Promise.resolve<Record<string, VariantPricingData>>({}),
  ])

  const initialPrices: Record<string, number | null> = {}
  for (const product of products) {
    initialPrices[product.id] = computeProductDynamicPrice(
      product,
      pricingData,
      spotPrices
    )
  }

  return (
    <div className="py-6 content-container" data-testid="search-container">
      <div className="mb-8 flex flex-col gap-y-2">
        <Heading level="h1" size="lg">
          {query ? t("resultsFor", { query }) : t("title")}
        </Heading>
        <Text variant="muted" data-testid="search-result-count">
          {query ? t("resultCount", { count: products.length }) : t("prompt")}
        </Text>
      </div>
      {query && products.length === 0 && (
        <Text variant="muted">{t("noResults")}</Text>
      )}
      {products.length > 0 && (
        <SortedProductGrid
          products={products}
          pricingData={pricingData}
          sortBy="category"
          initialPrices={initialPrices}
        />
      )}
    </div>
  )
}
