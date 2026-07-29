"use client"

import { Heading } from "@modules/common/components/ui"
import CartTotals from "@modules/common/components/cart-totals"
import { useCartPricing } from "@lib/hooks/use-cart-pricing"
import { goToCheckout } from "@lib/data/cart"
import { getCountryCodeFromParams } from "@lib/util/route"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useActionState } from "react"
import { useCart } from "@modules/cart/context/cart-context"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import ErrorMessage from "@modules/checkout/components/error-message"

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
  const { subtotal: dynamicSubtotal } = useCartPricing(
    effectiveCart,
    regionCurrencyCode,
  )
  const params = useParams()
  const countryCode = getCountryCodeFromParams(params)
  const step = getCheckoutStep(effectiveCart)
  const t = useTranslations("cart")
  const [error, formAction] = useActionState(goToCheckout, null)

  const dynamicTotal =
    dynamicSubtotal > 0
      ? dynamicSubtotal +
        (effectiveCart.shipping_subtotal ?? 0) +
        (effectiveCart.tax_total ?? 0)
      : null

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" size="2xl">
        {t("summaryTitle")}
      </Heading>
      <CartTotals
        totals={effectiveCart}
        subtotalOverride={dynamicSubtotal > 0 ? dynamicSubtotal : null}
        totalOverride={dynamicTotal}
      />
      <form action={formAction}>
        <input type="hidden" name="cart_id" value={effectiveCart.id} />
        <input type="hidden" name="country_code" value={countryCode ?? ""} />
        <input type="hidden" name="step" value={step} />
        <SubmitButton className="w-full h-10" data-testid="checkout-button">
          {t("checkout")}
        </SubmitButton>
        <ErrorMessage error={error} data-testid="checkout-error-message" />
      </form>
    </div>
  )
}

export default Summary
