import { HttpTypes } from "@medusajs/types"
import {
  BUILDER,
  CONTACT_EMAIL,
  DEMO_NOTICE,
  RETURN_POLICY,
  SHIPPING_POLICY,
  STORE_NAME,
  getShippingRates,
} from "@lib/store-policies"
import { absoluteUrl } from "@lib/util/env"
import { isVariantInStock } from "@lib/util/product"

type JsonLdValue =
  | string
  | number
  | boolean
  | JsonLdObject
  | JsonLdValue[]
export type JsonLdObject = { [key: string]: JsonLdValue }

export function productPath(countryCode: string, handle: string): string {
  return `/${countryCode}/products/${handle}`
}

/** Fraction digits the currency uses (2 for USD/EUR, 0 for JPY/KRW). */
function currencyFractionDigits(currencyCode: string): number {
  return (
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits ?? 2
  )
}

/** Machine-readable price: dot decimal, rounded the same way the UI rounds it. */
export function formatSchemaPrice(amount: number, currencyCode: string): string {
  return amount.toFixed(currencyFractionDigits(currencyCode))
}

export function schemaAvailability(inStock: boolean): string {
  return inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"
}

export function merchantReturnPolicy(countryCode: string): JsonLdObject {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: countryCode.toUpperCase(),
    returnPolicyCategory: RETURN_POLICY.category,
    merchantReturnDays: RETURN_POLICY.days,
    returnMethod: RETURN_POLICY.method,
    returnFees: RETURN_POLICY.fees,
    merchantReturnLink: absoluteUrl(`/${countryCode}/returns`),
  }
}

function deliveryTime(transitDays: { min: number; max: number }): JsonLdObject {
  return {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: SHIPPING_POLICY.handlingDays.min,
      maxValue: SHIPPING_POLICY.handlingDays.max,
      unitCode: "DAY",
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: transitDays.min,
      maxValue: transitDays.max,
      unitCode: "DAY",
    },
  }
}

export function offerShippingDetails(
  countryCode: string,
  currencyCode: string
): JsonLdObject[] {
  const rates = getShippingRates(currencyCode)

  if (!rates) {
    return []
  }

  const methods = [
    { ...SHIPPING_POLICY.standard, rate: rates.standard },
    { ...SHIPPING_POLICY.express, rate: rates.express },
  ]

  return methods.map((method) => ({
    "@type": "OfferShippingDetails",
    shippingLabel: method.name,
    shippingRate: {
      "@type": "MonetaryAmount",
      value: formatSchemaPrice(method.rate, currencyCode),
      currency: currencyCode.toUpperCase(),
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: countryCode.toUpperCase(),
    },
    deliveryTime: deliveryTime(method.transitDays),
  }))
}

function productBrand(product: HttpTypes.StoreProduct): string {
  const brand = product.metadata?.brand
  return typeof brand === "string" && brand.length > 0 ? brand : STORE_NAME
}

function productImages(product: HttpTypes.StoreProduct): string[] {
  const urls = (product.images ?? []).map((image) => image.url)
  if (product.thumbnail && !urls.includes(product.thumbnail)) {
    urls.unshift(product.thumbnail)
  }
  return urls
}

/**
 * Product JSON-LD for Google merchant listings. One Offer per variant that has
 * a computable price; `variantPrices` must be the same numbers the page shows.
 */
export function buildProductJsonLd({
  product,
  countryCode,
  currencyCode,
  variantPrices,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
  currencyCode: string
  variantPrices: Map<string, number>
}): JsonLdObject | null {
  const pageUrl = absoluteUrl(productPath(countryCode, product.handle))
  const shippingDetails = offerShippingDetails(countryCode, currencyCode)
  const returnPolicy = merchantReturnPolicy(countryCode)
  const variants = product.variants ?? []

  const offers: JsonLdObject[] = variants.flatMap((variant) => {
    const price = variantPrices.get(variant.id)
    if (price === undefined || price <= 0) {
      return []
    }

    const offer: JsonLdObject = {
      "@type": "Offer",
      url: variants.length > 1 ? `${pageUrl}?v_id=${variant.id}` : pageUrl,
      sku: variant.sku ?? variant.id,
      price: formatSchemaPrice(price, currencyCode),
      priceCurrency: currencyCode.toUpperCase(),
      availability: schemaAvailability(isVariantInStock(variant)),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: STORE_NAME },
      hasMerchantReturnPolicy: returnPolicy,
    }

    if (variants.length > 1 && variant.title) {
      offer.name = `${product.title} – ${variant.title}`
    }
    if (shippingDetails.length > 0) {
      offer.shippingDetails = shippingDetails
    }
    const gtin = variant.ean ?? variant.upc ?? variant.barcode
    if (gtin) {
      offer.gtin = gtin
    }

    return [offer]
  })

  if (offers.length === 0) {
    return null
  }

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: product.title,
    description: product.description || product.subtitle || product.title,
    url: pageUrl,
    image: productImages(product),
    brand: { "@type": "Brand", name: productBrand(product) },
    offers,
  }

  if (variants.length === 1) {
    jsonLd.sku = variants[0].sku ?? variants[0].id
  }
  if (product.material) {
    jsonLd.material = product.material
  }

  return jsonLd
}

export function buildHomeJsonLd(countryCode: string): JsonLdObject {
  const homeUrl = absoluteUrl(`/${countryCode}`)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${homeUrl}#website`,
        name: STORE_NAME,
        url: homeUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl(`/${countryCode}/search`)}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "OnlineStore",
        "@id": `${homeUrl}#organization`,
        name: STORE_NAME,
        description: DEMO_NOTICE,
        parentOrganization: {
          "@type": "Organization",
          name: BUILDER.name,
          url: BUILDER.url,
        },
        url: homeUrl,
        logo: absoluteUrl("/fluctum-logo-full.svg"),
        email: CONTACT_EMAIL,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT_EMAIL,
          url: absoluteUrl(`/${countryCode}/contact`),
        },
        hasMerchantReturnPolicy: merchantReturnPolicy(countryCode),
      },
    ],
  }
}

/** Serializes JSON-LD for a <script> tag, escaping `<` so it can't break out. */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
