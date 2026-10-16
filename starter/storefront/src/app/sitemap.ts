import { MetadataRoute } from "next"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { POLICY_PAGES } from "@lib/store-policies"
import { absoluteUrl } from "@lib/util/env"

// Regenerated at most hourly, so added/removed/changed products show up.
export const revalidate = 3600

const PRODUCT_PAGE_SIZE = 100

async function listAllProducts(countryCode: string) {
  const products: { handle: string; updated_at?: string | null }[] = []

  for (let page = 1; ; page++) {
    const { response, nextPage } = await listProducts({
      pageParam: page,
      countryCode,
      queryParams: { limit: PRODUCT_PAGE_SIZE, fields: "handle,updated_at" },
    })
    products.push(...response.products)
    if (!nextPage) {
      return products
    }
  }
}

type SitemapEntry = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const regions = await listRegions()
  const countryCodes = regions.flatMap((region) =>
    (region.countries ?? []).flatMap((c) => (c.iso_2 ? [c.iso_2] : []))
  )

  if (countryCodes.length === 0) {
    return []
  }

  // The catalog is the same in every region; only prices differ.
  const [products, { collections }] = await Promise.all([
    listAllProducts(countryCodes[0]),
    listCollections({ fields: "handle,updated_at" }),
  ])

  return countryCodes.flatMap((countryCode): MetadataRoute.Sitemap => [
    { url: absoluteUrl(`/${countryCode}`), changeFrequency: "always" },
    { url: absoluteUrl(`/${countryCode}/store`), changeFrequency: "always" },
    ...products.map((product): SitemapEntry => ({
      url: absoluteUrl(`/${countryCode}/products/${product.handle}`),
      lastModified: product.updated_at ?? undefined,
      changeFrequency: "always",
    })),
    ...collections.map((collection): SitemapEntry => ({
      url: absoluteUrl(`/${countryCode}/collections/${collection.handle}`),
      lastModified: collection.updated_at ?? undefined,
    })),
    ...POLICY_PAGES.map((page): SitemapEntry => ({
      url: absoluteUrl(`/${countryCode}${page.path}`),
      changeFrequency: "yearly",
    })),
  ])
}
