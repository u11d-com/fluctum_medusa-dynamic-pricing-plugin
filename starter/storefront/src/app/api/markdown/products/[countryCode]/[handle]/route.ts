import { listProducts } from "@lib/data/products"
import {
  computeSnapshotVariantPrices,
  getPricingSnapshot,
} from "@lib/data/product-pricing"
import { getRegion } from "@lib/data/regions"
import { DEMO_NOTICE, POLICY_PAGES, RETURN_POLICY } from "@lib/store-policies"
import { absoluteUrl } from "@lib/util/env"
import { convertToLocale } from "@lib/util/money"
import { isVariantInStock } from "@lib/util/product"
import { productPath } from "@lib/util/structured-data"

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "Cache-Control": "no-store",
}

/**
 * Markdown rendering of a product page for AI agents. Reached through the
 * middleware rewrite of `/{countryCode}/products/{handle}.md` and of product
 * URLs requested with `Accept: text/markdown`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string; handle: string }> }
) {
  const { countryCode, handle } = await params
  const region = await getRegion(countryCode)

  const product = region
    ? await listProducts({ countryCode, queryParams: { handle } }).then(
        ({ response }) => response.products[0]
      )
    : undefined

  if (!region || !product) {
    return new Response("# Not found\n\nNo product with this URL.\n", {
      status: 404,
      headers: MARKDOWN_HEADERS,
    })
  }

  const currencyCode = region.currency_code
  const variants = product.variants ?? []
  const snapshot = await getPricingSnapshot(variants)
  const prices = computeSnapshotVariantPrices(snapshot, variants, currencyCode)
  const pageUrl = absoluteUrl(productPath(countryCode, product.handle))

  const variantLines = variants.map((variant) => {
    const price = prices.get(variant.id)
    const priceText =
      price !== undefined
        ? convertToLocale({ amount: price, currency_code: currencyCode })
        : "price unavailable"
    const stock = isVariantInStock(variant) ? "In stock" : "Out of stock"
    const url = variants.length > 1 ? `${pageUrl}?v_id=${variant.id}` : pageUrl
    return `| [${variant.title ?? product.title}](${url}) | ${priceText} | ${stock} | \`${variant.id}\` |`
  })

  const details = [
    product.material && `- Material: ${product.material}`,
    product.type?.value && `- Type: ${product.type.value}`,
    product.origin_country && `- Country of origin: ${product.origin_country}`,
    variants[0]?.weight && `- Weight: ${variants[0].weight} g`,
  ].filter((line): line is string => Boolean(line))

  const markdown = [
    `# ${product.title}`,
    "",
    `> **Demo store — not for sale.** ${DEMO_NOTICE}`,
    "",
    ...(product.subtitle ? [product.subtitle, ""] : []),
    ...(product.description ? [product.description, ""] : []),
    `Canonical URL: ${pageUrl}`,
    "",
    "## Price and availability",
    "",
    `Prices are in ${currencyCode.toUpperCase()}, follow the live spot price and are locked when you go to checkout.`,
    "",
    "| Variant | Price | Availability | Variant ID |",
    "| --- | --- | --- | --- |",
    ...variantLines,
    "",
    ...(details.length > 0 ? ["## Details", "", ...details, ""] : []),
    "## Buy",
    "",
    `Open \`${absoluteUrl("/buy")}/{variant_id}:{quantity}\` to get a checkout link with the item in the cart.`,
    "",
    "## Policies",
    "",
    `- Returns: ${RETURN_POLICY.days} days, free return by mail`,
    ...POLICY_PAGES.map(
      (page) => `- ${absoluteUrl(`/${countryCode}${page.path}`)}`
    ),
    "",
  ].join("\n")

  return new Response(markdown, { headers: MARKDOWN_HEADERS })
}
