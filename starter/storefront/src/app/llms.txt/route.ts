import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import {
  BUILDER,
  DEMO_NOTICE,
  FRAMEWORK_URL,
  POLICY_PAGES,
} from "@lib/store-policies"
import { absoluteUrl } from "@lib/util/env"

export const revalidate = 3600

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const POLICY_TITLES: Record<(typeof POLICY_PAGES)[number]["key"], string> = {
  returnPolicy: "Return policy",
  shippingInformation: "Shipping information",
  termsOfService: "Terms of service",
  privacyPolicy: "Privacy policy",
  contact: "Contact",
}

export async function GET() {
  const base = `/${DEFAULT_REGION}`
  const [{ response }, { collections }] = await Promise.all([
    listProducts({
      countryCode: DEFAULT_REGION,
      queryParams: { limit: 100, fields: "handle,title" },
    }),
    listCollections({ fields: "handle,title" }),
  ])

  const link = (title: string, path: string, note?: string) =>
    `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`

  const lines = [
    "# Fluctum",
    "",
    "> Demo precious metals store (gold, silver, platinum, palladium coins and bars) showcasing the Fluctum dynamic pricing framework: prices follow live spot prices and are locked at checkout.",
    "",
    `**Demo store — nothing here is for sale.** ${DEMO_NOTICE} Framework: ${FRAMEWORK_URL}, built by [${BUILDER.name}](${BUILDER.url}).`,
    "",
    "Prices are quoted per region; replace `" +
      DEFAULT_REGION +
      "` in any URL with another country code (e.g. `de`, `pl`) to get local currency. Append `.md` to a product URL, or send `Accept: text/markdown`, for a Markdown version.",
    "",
    "## Shop",
    link("All products", `${base}/store`),
    link("Search", `${base}/search?q={query}`, "server-rendered results, GET"),
    ...collections.map((c) => link(c.title, `${base}/collections/${c.handle}`)),
    "",
    "## Products",
    ...response.products.map((p) =>
      link(p.title, `${base}/products/${p.handle}.md`)
    ),
    "",
    "## Policies",
    ...POLICY_PAGES.map((page) =>
      link(POLICY_TITLES[page.key], `${base}${page.path}`)
    ),
    "",
    "## Agent endpoints",
    link("UCP profile", "/.well-known/ucp"),
    link(
      "Cart permalink",
      "/buy/{variant_id}:{quantity}",
      "creates a cart with the given variants and redirects (303) to checkout; comma-separate multiple items"
    ),
    link("Sitemap", "/sitemap.xml"),
    "",
  ]

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
