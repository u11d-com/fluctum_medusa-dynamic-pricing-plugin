import { NextRequest, NextResponse } from "next/server"
import { addToCart } from "@lib/data/cart"
import { absoluteUrl } from "@lib/util/env"
import { getFormString } from "@lib/util/form-data"

/**
 * No-JS fallback for the product page add-to-cart form. With JS the form
 * submission is intercepted client-side; without it the browser posts here.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params
  const formData = await request.formData()
  const variantId = getFormString(formData, "variant_id")
  const quantity = Number.parseInt(getFormString(formData, "quantity") || "1", 10)

  if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
    return new NextResponse("Missing or invalid variant_id / quantity", {
      status: 400,
    })
  }

  try {
    await addToCart({ variantId, quantity, countryCode })
  } catch {
    return new NextResponse("Could not add the item to the cart", {
      status: 422,
    })
  }

  return NextResponse.redirect(absoluteUrl(`/${countryCode}/cart`), 303)
}
