"use client"

import { Button, Heading } from "@modules/common/components/ui"
import CartTotals from "@modules/common/components/cart-totals"
import { Divider } from "@modules/common/components/ui"
import { useCartPricing } from "@lib/hooks/use-cart-pricing"
import { lockCartPrices } from "@lib/data/cart"
import { getCountryCodeFromParams } from "@lib/util/route"
import { HttpTypes } from "@medusajs/types"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { useCart } from "@modules/cart/context/cart-context"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const { cart: contextCart, regionCurrencyCode } = useCart()
  const effectiveCart = contextCart ?? cart
  const { subtotal: dynamicSubtotal } = useCartPricing(effectiveCart, regionCurrencyCode)
  const router = useRouter()
  const params = useParams()
  const countryCode = getCountryCodeFromParams(params)
  const [isLocking, setIsLocking] = useState(false)
  const step = getCheckoutStep(effectiveCart)

  const dynamicTotal = dynamicSubtotal > 0
    ? dynamicSubtotal + (effectiveCart.shipping_subtotal ?? 0) + (effectiveCart.tax_total ?? 0)
    : null

  const handleCheckout = async () => {
    if (!effectiveCart.id || !countryCode) return
    setIsLocking(true)

    try {
      await lockCartPrices(effectiveCart.id, true)
      router.push(`/${countryCode}/checkout?step=${step}`)
    } catch {
      setIsLocking(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" size="2xl">
        Summary
      </Heading>
      <Divider />
      <CartTotals totals={effectiveCart} subtotalOverride={dynamicSubtotal > 0 ? dynamicSubtotal : null} totalOverride={dynamicTotal} />
      <Button
        className="w-full h-10"
        onClick={handleCheckout}
        disabled={isLocking}
        data-testid="checkout-button"
      >
        {isLocking ? "Locking Prices…" : "Go To Checkout"}
      </Button>
    </div>
  )
}

export default Summary
