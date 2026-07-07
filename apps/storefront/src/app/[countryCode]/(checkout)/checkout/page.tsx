import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

// Force dynamic rendering so retrieveCart() always fetches fresh data after
// initiatePaymentSession's revalidateTag, preventing stale payment_collection.
export const dynamic = "force-dynamic"

export default async function Checkout() {
  // Use noCache so this page always fetches the latest cart from the server
  // (e.g. after initiatePaymentSession sets up payment_collection).
  const cart = await retrieveCart(undefined, undefined, true)

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
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
