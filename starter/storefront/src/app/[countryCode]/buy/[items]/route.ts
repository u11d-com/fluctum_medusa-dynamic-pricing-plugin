import { NextResponse } from "next/server"
import { createCartWithItems } from "@lib/data/cart"
import { listExistingVariantIds } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { absoluteUrl } from "@lib/util/env"
import { parsePermalinkItems } from "@lib/util/permalink"

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
}

function errorResponse(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: { ...NO_STORE_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  })
}

/**
 * UCP cart permalink: GET /{countryCode}/buy/{variant_id}:{qty},... creates a
 * fresh cart with those items and sends the shopper to checkout (303).
 * No login is required; prices are locked when the checkout page loads.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ countryCode: string; items: string }> }
) {
  const { countryCode, items: segment } = await params

  if (!(await getRegion(countryCode))) {
    return errorResponse(404, `Unknown region: ${countryCode}`)
  }

  const items = parsePermalinkItems(segment)
  if (!items) {
    return errorResponse(
      400,
      "Malformed permalink. Expected /buy/{variant_id}:{quantity},{variant_id}:{quantity}"
    )
  }

  const existing = await listExistingVariantIds(items.map((i) => i.variantId))
  const unknown = items.filter((item) => !existing.has(item.variantId))
  if (unknown.length > 0) {
    return errorResponse(
      404,
      `Unknown product variant(s): ${unknown.map((i) => i.variantId).join(", ")}`
    )
  }

  try {
    await createCartWithItems(countryCode, items)
  } catch {
    return errorResponse(409, "These items cannot be purchased right now.")
  }

  return new NextResponse(null, {
    status: 303,
    headers: {
      ...NO_STORE_HEADERS,
      Location: absoluteUrl(`/${countryCode}/checkout?step=address`),
    },
  })
}
