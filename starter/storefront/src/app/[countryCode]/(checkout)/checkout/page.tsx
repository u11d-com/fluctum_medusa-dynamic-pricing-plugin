import { retrieveCartWithLock } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

// Force dynamic rendering so retrieveCartWithLock() always fetches fresh data
// after initiatePaymentSession's revalidateTag, preventing stale
// payment_collection, and so prices are (re-)locked idempotently on every
// navigation into this route.
export const dynamic = "force-dynamic"

export default async function Checkout() {
  const { cart, lockedPrices, expiresAt, lockError } =
    await retrieveCartWithLock(undefined, false)

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary
          cart={cart}
          initialLockedPrices={lockedPrices}
          initialExpiresAt={expiresAt}
          initialError={lockError}
        />
      </div>
    </div>
  )
}
