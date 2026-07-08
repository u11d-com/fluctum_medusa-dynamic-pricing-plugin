"use client"

import { useTranslations } from 'next-intl'
import { Text } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import CheckoutStepCard from "../checkout-step-card"
import { useCart } from "@modules/cart/context/cart-context"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const t = useTranslations('checkout')
  const searchParams = useSearchParams()
  const { cart: contextCart } = useCart()
  const effectiveCart = contextCart ?? cart

  const isOpen = searchParams.get("step") === "review"

  // When the step is open (URL = review), address + shipping are already confirmed.
  // We trust that navigation to this step only happens after payment is set up,
  // so we don't read payment_collection from a potentially stale cart prop.
  const previousStepsCompleted =
    isOpen
      ? effectiveCart.shipping_address &&
        (effectiveCart.shipping_methods?.length ?? 0) > 0
      : effectiveCart.shipping_address &&
        (effectiveCart.shipping_methods?.length ?? 0) > 0 &&
        effectiveCart.payment_collection

  return (
    <CheckoutStepCard
      title={t('review')}
      isOpen={isOpen}
      disabled={!isOpen}
      dataTestId="checkout-review-step"
    >
      {isOpen && previousStepsCompleted && (
        <>
            <div className="flex items-start gap-x-1 w-full mb-6">
              <div className="w-full">
              <Text as="span" variant="label" className="mb-1">
                {t('orderAgreement')}
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </CheckoutStepCard>
  )
}

export default Review
