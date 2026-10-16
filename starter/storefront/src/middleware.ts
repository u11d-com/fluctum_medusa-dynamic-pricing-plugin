import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import { getLocaleFromCountry } from "@lib/util/locale-map"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "dk"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const json = await response.json()

    const { regions } = json

    if (!regions?.length) {
      return new Map<string, HttpTypes.StoreRegion>()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  let countryCode

  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  // Cloudflare Workers provides country via request.cf.country
  const cloudflareCountryCode = (request as { cf?: { country?: string } }).cf?.country?.toLowerCase()

  // Vercel provides x-vercel-ip-country header
  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    countryCode = urlCountryCode
  } else if (cloudflareCountryCode && regionMap.has(cloudflareCountryCode)) {
    countryCode = cloudflareCountryCode
  } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    countryCode = vercelCountryCode
  } else if (regionMap.has(DEFAULT_REGION)) {
    countryCode = DEFAULT_REGION
  } else if (regionMap.keys().next().value) {
    countryCode = regionMap.keys().next().value
  }

  return countryCode
}

const PRODUCT_PATH = /^\/([a-z]{2})\/products\/([^/.]+)(\.md)?$/

/** True when the client prefers Markdown over HTML (e.g. `Accept: text/markdown`). */
function prefersMarkdown(request: NextRequest) {
  const accept = request.headers.get("accept") ?? ""
  const markdown = accept.indexOf("text/markdown")
  const html = accept.indexOf("text/html")
  return markdown !== -1 && (html === -1 || markdown < html)
}

/**
 * Serves the Markdown version of product pages for `<product>.md` URLs and
 * for product URLs requested with `Accept: text/markdown`.
 */
function productMarkdownResponse(request: NextRequest) {
  const match = request.nextUrl.pathname.match(PRODUCT_PATH)
  if (!match) {
    return null
  }

  const [, countryCode, handle, mdSuffix] = match
  if (!mdSuffix && !prefersMarkdown(request)) {
    return null
  }

  const url = request.nextUrl.clone()
  url.pathname = `/api/markdown/products/${countryCode}/${handle}`
  return NextResponse.rewrite(url)
}

/** Paths served for the visitor's region without a redirect (agent-facing entry points). */
const REWRITE_WITHOUT_COUNTRY = /^\/(search$|buy\/)/

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  const markdownResponse = productMarkdownResponse(request)
  if (markdownResponse) {
    return markdownResponse
  }

  if (request.nextUrl.pathname.includes(".")) {
    const requestHeaders = new Headers(request.headers)
    const earlyCountry = request.nextUrl.pathname.split("/")[1]?.toLowerCase() || DEFAULT_REGION
    requestHeaders.set("x-locale", getLocaleFromCountry(earlyCountry))
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)
  const countryCode = await getCountryCode(request, regionMap)

  // if the country code is available, use it, otherwise use the default region
  const country = countryCode || DEFAULT_REGION
  const locale = getLocaleFromCountry(country)
  const firstPathSegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  const urlHasCountry = firstPathSegment === country.toLowerCase()

  if (urlHasCountry) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-locale", locale)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (!cacheIdCookie) {
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
    }
    // Product URLs return Markdown for `Accept: text/markdown`.
    if (PRODUCT_PATH.test(request.nextUrl.pathname)) {
      response.headers.set("Vary", "Accept")
    }
    return response
  }

  if (REWRITE_WITHOUT_COUNTRY.test(request.nextUrl.pathname)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-locale", locale)
    const url = request.nextUrl.clone()
    url.pathname = `/${country}${request.nextUrl.pathname}`
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  // if the url doesn't have the country, redirect to it
  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
  const queryString = request.nextUrl.search || ""
  const redirectUrl = `${request.nextUrl.origin}/${country}${redirectPath}${queryString}`

  return NextResponse.redirect(redirectUrl, 307)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
