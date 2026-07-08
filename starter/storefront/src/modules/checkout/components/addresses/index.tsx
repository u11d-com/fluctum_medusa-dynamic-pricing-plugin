"use client"
import { useTranslations } from 'next-intl'
import { setAddresses } from "@lib/data/cart"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { Divider, Heading, Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import AddressSummaryBlock from "../address-summary-block"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"
import CheckoutStepCard from "../checkout-step-card"

function formatAddressLine(
  first?: string | null,
  second?: string | null
): string | null {
  const left = first ?? ""
  const right = second ?? ""
  const combined = `${left} ${right}`.trim()

  return combined || null
}

function formatPostalCityLine(
  postalCode?: string | null,
  city?: string | null
): string | null {
  const left = postalCode ?? ""
  const right = city ?? ""
  const combined = `${left}, ${right}`.replace(/^,\s*/, "").replace(/,\s*$/, "").trim()

  return combined || null
}

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const t = useTranslations('checkout')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <CheckoutStepCard
      title={t('shippingAddress')}
      isOpen={isOpen}
      isComplete={!isOpen}
      canEdit={!isOpen && !!cart?.shipping_address}
      onEdit={handleEdit}
      dataTestId="checkout-address-step"
    >
      {isOpen ? (
        <form action={formAction}>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  size="2xl"
                  className="gap-x-4 pb-6 pt-8"
                >
                  {t('billingAddress')}
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton className="mt-6" data-testid="submit-address-button">
              {t('continueToDelivery')}
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div>
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex items-start gap-x-1 w-full">
                  <AddressSummaryBlock
                    title={t('shippingAddress')}
                    dataTestId="shipping-address-summary"
                    lines={[
                      formatAddressLine(
                        cart.shipping_address.first_name,
                        cart.shipping_address.last_name
                      ),
                      formatAddressLine(
                        cart.shipping_address.address_1,
                        cart.shipping_address.address_2
                      ),
                      formatPostalCityLine(
                        cart.shipping_address.postal_code,
                        cart.shipping_address.city
                      ),
                      cart.shipping_address.country_code?.toUpperCase(),
                    ]}
                  />

                  <AddressSummaryBlock
                    title={t('contact')}
                    dataTestId="shipping-contact-summary"
                    lines={[cart.shipping_address.phone, cart.email]}
                  />

                  <AddressSummaryBlock
                    title={t('billingAddress')}
                    dataTestId="billing-address-summary"
                    lines={
                      sameAsBilling
                        ? [t('sameAsBilling')]
                        : [
                            formatAddressLine(
                              cart.billing_address?.first_name,
                              cart.billing_address?.last_name
                            ),
                            formatAddressLine(
                              cart.billing_address?.address_1,
                              cart.billing_address?.address_2
                            ),
                            formatPostalCityLine(
                              cart.billing_address?.postal_code,
                              cart.billing_address?.city
                            ),
                            cart.billing_address?.country_code?.toUpperCase(),
                          ]
                    }
                  />
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
                <Text className="sr-only">{t('loadingAddressData')}</Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </CheckoutStepCard>
  )
}

export default Addresses
