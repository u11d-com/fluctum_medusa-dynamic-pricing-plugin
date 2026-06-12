"use client"

import { Button, Heading } from "@modules/common/components/ui"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { useCartPricing } from "@lib/hooks/use-cart-pricing"
import { lockCartPrices } from "@lib/data/cart"
import { getCountryCodeFromParams } from "@lib/util/route"
import { HttpTypes } from "@medusajs/types"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"

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
  const { subtotal: dynamicSubtotal } = useCartPricing(cart)
  const router = useRouter()
  const params = useParams()
  const countryCode = getCountryCodeFromParams(params)
  const [isLocking, setIsLocking] = useState(false)
  const step = getCheckoutStep(cart)

  const dynamicTotal = dynamicSubtotal > 0
    ? dynamicSubtotal + (cart.shipping_subtotal ?? 0) + (cart.tax_total ?? 0)
    : undefined

  const handleCheckout = async () => {
    if (!cart.id || !countryCode) return
    setIsLocking(true)

    try {
      await lockCartPrices(cart.id, true)
      router.push(`/${countryCode}/checkout?step=${step}`)
    } catch {
      setIsLocking(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" variant="checkout">
        Summary
      </Heading>
      <Divider />
      <CartTotals totals={cart} subtotalOverride={dynamicSubtotal > 0 ? dynamicSubtotal : undefined} totalOverride={dynamicTotal} />
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
