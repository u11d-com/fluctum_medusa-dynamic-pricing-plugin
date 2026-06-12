"use client"

import { Text } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import CheckoutStepCard from "../checkout-step-card"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    cart.payment_collection

  return (
    <CheckoutStepCard
      title="Review"
      isOpen={isOpen}
      disabled={!isOpen}
      dataTestId="checkout-review-step"
    >
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  By placing your order, you agree to our Terms of Sale and
                  Returns Policy and acknowledge our Privacy Policy.
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
