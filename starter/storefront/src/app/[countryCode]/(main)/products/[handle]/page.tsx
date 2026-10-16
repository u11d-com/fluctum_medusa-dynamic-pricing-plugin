import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import {
  computeSnapshotVariantPrices,
  getPricingSnapshot,
} from "@lib/data/product-pricing"
import { absoluteUrl } from "@lib/util/env"
import { isVariantInStock } from "@lib/util/product"
import {
  buildProductJsonLd,
  formatSchemaPrice,
  productPath,
} from "@lib/util/structured-data"
import JsonLd from "@modules/common/components/json-ld"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat(),
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        })),
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`,
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string,
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const canonicalPath = productPath(params.countryCode, product.handle)
  const description = product.description || product.subtitle || product.title

  return {
    title: `${product.title} | Fluctum`,
    description,
    alternates: {
      canonical: canonicalPath,
      types: { "text/markdown": `${canonicalPath}.md` },
    },
    openGraph: {
      title: `${product.title} | Fluctum`,
      description,
      url: canonicalPath,
      siteName: "Fluctum",
      images: product.thumbnail ? [absoluteUrl(product.thumbnail)] : [],
    },
  }
}

/** Variant from `?v_id=` when valid, otherwise the first in-stock variant. */
function getInitialVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string,
) {
  const variants = product.variants ?? []
  return (
    variants.find((v) => v.id === selectedVariantId) ??
    variants.find(isVariantInStock) ??
    variants[0]
  )
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)
  const initialVariant = getInitialVariant(pricedProduct, selectedVariantId)
  const currencyCode = region.currency_code.toUpperCase()

  // Same snapshot seeds the visible price and the structured data, so they match.
  const pricingSnapshot = await getPricingSnapshot(pricedProduct.variants)
  const variantPrices = computeSnapshotVariantPrices(
    pricingSnapshot,
    pricedProduct.variants ?? [],
    currencyCode,
  )
  const productJsonLd = buildProductJsonLd({
    product: pricedProduct,
    countryCode: params.countryCode,
    currencyCode,
    variantPrices,
  })
  const ogPrice = initialVariant ? variantPrices.get(initialVariant.id) : undefined

  return (
    <>
      <meta property="og:type" content="product" />
      {ogPrice !== undefined && initialVariant && (
        <>
          <meta
            property="product:price:amount"
            content={formatSchemaPrice(ogPrice, currencyCode)}
          />
          <meta property="product:price:currency" content={currencyCode} />
          <meta
            property="og:price:amount"
            content={formatSchemaPrice(ogPrice, currencyCode)}
          />
          <meta property="og:price:currency" content={currencyCode} />
          <meta
            property="product:availability"
            content={isVariantInStock(initialVariant) ? "in stock" : "out of stock"}
          />
        </>
      )}
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images ?? []}
        initialPricing={pricingSnapshot}
        initialVariantId={initialVariant?.id}
      />
    </>
  )
}
